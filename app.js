const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sequelize = require("./util/database");
const corsOptions = require("./config/corsOptions");
const cors = require("cors");
const rateLimiter = require("./middlewares/rateLimiter");
const globalErrorHandler = require("./controllers/errorController");
const cookieParser = require("cookie-parser");
const CryptoJS = require("crypto-js")
const forge = require('node-forge');
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false })); //basically tells the system whether you want to use a simple algorithm for shallow parsig (i.e. false) or complex algorithm for deep parsing that can deal with nested objects (i.e. true).
app.use(bodyParser.json()); // basically tells the system that you want json to be used.
app.use(express.static(path.join(__dirname, "public")));
app.use(cors(corsOptions));
app.use(rateLimiter);
app.set("view engine", "ejs");
app.set("views", "views");
app.use(cookieParser());

const routes = require("./routes/routes");
app.use(routes);

app.use(globalErrorHandler);
const models = require("./models/index");

server = app.listen(port, "localhost", () => console.log("listening on port " + port));

function encryptAES(data, symmetricKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), symmetricKey).toString();
}
function decryptAES(ciphertext, symmetricKey) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, symmetricKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
// Generate RSA key pair
const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
// Convert keys to PEM format for transmission/storage
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
const encryptRSA = (publicKey, message) => {
    const encrypted = publicKey.encrypt(JSON.stringify(message), 'RSA-OAEP');
    const encryptedBase64 = forge.util.encode64(encrypted);
    return encryptedBase64;
};
// Decrypt data received from the client
function decryptRSA(encryptedData) {
    const decrypted = privateKey.decrypt(forge.util.decode64(encryptedData), 'RSA-OAEP');
    return JSON.parse(decrypted);
}
const io = require("./socket").init(server);
io.on("connection", socket => {
    console.log("A client connected");
    // Send the public key to the clients for encryption
    socket.emit("serverPublicKeyPem", publicKeyPem);

    let clientPublicKey;
    socket.on("clientPublicKeyPem", async (clientPublicKeyPem) => {
        clientPublicKey = await forge.pki.publicKeyFromPem(clientPublicKeyPem);
        try {
            // Initialize the client public key
            clientPublicKey = forge.pki.publicKeyFromPem(clientPublicKeyPem);

            // Generate session key and encrypt it using the client's public key
            socket.sessionKey = crypto.randomBytes(32).toString("hex");
            const encryptedSessionKey = encryptRSA(clientPublicKey, socket.sessionKey);
            // Send the encrypted session key to the client
            socket.emit("sessionKey", encryptedSessionKey);
        } catch (error) {
            console.error("Error handling client public key:", error);
        }
    });

    socket.on("examinationRequest", async (encryptedData) => {
        try {
            const data = await decryptAES(encryptedData, process.env.ENCRYPTION_KEY);
            const { doctorName, date } = data;
            let doctor = await models.User.findOne({ where: { userName: doctorName } });
            let response;
            if (!doctor) {
                response = { message: "Doctor not found", statusCode: 400 };
            } else if (doctor.isDoctor === false) {
                response = { message: "The user is not a doctor", statusCode: 400 };
            } else {
                response = { message: `Doctor ${doctorName} is available at ${date}`, statusCode: 200 };
            }
            const encryptedResponse = await encryptAES(response, process.env.ENCRYPTION_KEY);
            io.emit("examinationResponse", encryptedResponse);
        } catch (error) {
            console.error("Error processing request:", error);
        }
    });


    socket.on("sendMedicalHistory", async (encryptedMessage) => {
        const decryptedData = await decryptAES(encryptedMessage, socket.sessionKey);
        const { diseases, surgeries, medications } = decryptedData;
        let response = { message: "Medical History received successfully", statusCode: 200 };
        let encryptedResponse = encryptAES(response, socket.sessionKey);
        io.emit("medicalHistoryResponse", encryptedResponse)
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});