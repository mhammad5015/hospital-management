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

function encryptAES(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY).toString();
}
function decryptAES(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
// Generate RSA key pair
const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
// Convert keys to PEM format for transmission/storage
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
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

    socket.on("examinationRequest", async (encryptedData) => {
        try {
            const data = decryptAES(encryptedData);
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
            const encryptedResponse = encryptAES(response);
            io.emit("examinationResponse", encryptedResponse);
        } catch (error) {
            console.error("Error processing request:", error);
        }
    });

    socket.on("sendMedicalHistory", async (encryptedMessage) => {
        const decryptedData = await decryptRSA(encryptedMessage);
        const { diseases, surgeries, medications } = decryptedData;
        console.log('Decrypted Message on Server:', decryptedData);
        io.emit("medicalHistoryResponse", { message: "Medical History received successfully", statusCode: 200 })
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});