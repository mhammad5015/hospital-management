require("dotenv").config();
const models = require("../models/index");
const CryptoJS = require("crypto-js")
const forge = require('node-forge');
const crypto = require("crypto");

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

exports.handleSocket = (socket) => {
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
            socket.emit("examinationResponse", encryptedResponse);
        } catch (error) {
            console.error("Error processing request:", error);
        }
    });


    socket.on("sendMedicalHistory", async (encryptedMessage) => {
        const decryptedData = await decryptAES(encryptedMessage, socket.sessionKey);
        const { diseases, surgeries, medications } = decryptedData;
        let response = { message: "Medical History received successfully", statusCode: 200 };
        let encryptedResponse = encryptAES(response, socket.sessionKey);
        socket.emit("medicalHistoryResponse", encryptedResponse)
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
}