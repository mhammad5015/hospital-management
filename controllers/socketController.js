require("dotenv").config();
const models = require("../models/index");
const forge = require('node-forge');
const crypto = require("crypto");

const { generateRSAKeys, encryptRSA, decryptRSA } = require("../util/security/rsaHelper");
const { encryptAES, decryptAES } = require("../util/security/aesHelper");
const examinationController = require("./symetricController");
const medicalController = require("./pgpController");

const keys = generateRSAKeys();
let privateKey = keys.privateKey;
let publicKey = keys.publicKey;
let publicKeyPem = keys.publicKeyPem;
let privateKeyPem = keys.privateKeyPem;

exports.handleSocket = (socket) => {
    console.log("A client connected");
    // Send the public key to the clients for encryption
    socket.emit("serverPublicKeyPem", publicKeyPem);

    let clientPublicKey;
    socket.on("clientPublicKeyPem", async (clientPublicKeyPem) => {
        try {
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

    socket.on("examinationRequest", (encryptedData) =>
        examinationController.handleRequest(socket, encryptedData)
    );

    socket.on("sendMedicalHistory", (encryptedData) =>
        medicalController.handleMedicalHistory(socket, encryptedData)
    );

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
}