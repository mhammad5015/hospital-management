require("dotenv").config();
const fs = require("fs");
const models = require("../models/index");
const forge = require('node-forge');
const crypto = require("crypto");

const { generateRSAKeys, encryptRSA, decryptRSA } = require("../util/security/rsaHelper");
const { encryptAES, decryptAES } = require("../util/security/aesHelper");
const { signMessage, verifyMessage } = require("../util/security/digitalSignatureHelper");
const { generateMathOperation, solveMathOperation } = require("../util/math");
const symetricController = require("./symetricController");
const pgpController = require("./pgpController");
const io = require("../socket").getIO();

let privateKey, publicKey, publicKeyPem, privateKeyPem;
const publicKeyPath = '../hospital-management/public.key';
const privateKeyPath = '../hospital-management/private.key';
try {
    publicKeyPem = fs.readFileSync(publicKeyPath, 'utf-8');
    publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    privateKeyPem = fs.readFileSync(privateKeyPath, 'utf-8');
    privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
} catch (err) {
    console.error('Error reading key file:', err);
}

const { issueCertificate, validateCertificate, generateCACertificate } = require("../util/security/certificateHelper");
const CA = generateCACertificate();
const CA_Certificate = CA.certificatePem;
const CA_PrivateKey = CA.privateKeyPem;

const userSocketMap = new Map();  // Map to store username → socket.id
exports.handleSocket = (socket) => {
    // Send the public key to the clients for encryption
    socket.emit("serverPublicKeyPem", publicKeyPem);

    socket.on("registerUser", (username) => {
        socket.userName = username;
        userSocketMap.set(username, socket.id); // username → socket.id
        console.log(`${username} registered with socket ID: ${socket.id}`);
    });

    let clientPublicKey;
    socket.on("clientPublicKeyPem", async (clientPublicKeyPem) => {
        try {
            socket.clientPublicKeyPem = clientPublicKeyPem;
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
        symetricController.handleRequest(socket, encryptedData, userSocketMap)
    );

    socket.on("sendMedicalHistory", (encryptedData) =>
        pgpController.handleMedicalHistory(socket, encryptedData)
    );

    socket.on("sendAppointmentConfirmation", (all) => {
        const isVerified = verifyMessage(all.data, all.signature, socket.clientPublicKeyPem);
        console.log("Client signature is valid?", isVerified);
        const patientSocketId = userSocketMap.get(all.data.patientName);
        if (patientSocketId) {
            io.to(patientSocketId).emit("appointmentConfirmationResault", all.data);
        } else {
            socket.emit("appointmentConfirmationResponse", `Patient is not connected`);
        }
        socket.emit("appointmentConfirmationResponse", `Client signature is valid? ${isVerified}`);
    })

    // CA Verifies CSR and Issues Certificate
    socket.on("CSR", (csrPem) => {
        socket.csrPem = csrPem;
        socket.operation = generateMathOperation();
        socket.emit("CSR_response", { operation: socket.operation, message: "CSR recived successfully.\nsolve the following chalange please.." });
    })

    socket.on("math_result", (answer) => {
        const correctAnswer = solveMathOperation(socket.operation);
        if (answer === correctAnswer) {
            const issuedCertificatePem = issueCertificate(socket.csrPem, CA_PrivateKey, CA_Certificate);
            console.log("Issued Certificate:\n", issuedCertificatePem);
            // certification request content
            // console.log(csr.subject.attributes);
            socket.emit("result_status", { message: "Correct! CSR processed.\nCertificate generated successfully.", certificate: issuedCertificatePem });
        } else {
            socket.emit("result_status", { message: "Incorrect answer. Try again.", certificate: null });
        }
    });

    socket.on("disconnect", () => {
        for (let [username, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(username);  // Remove disconnected user
                console.log(`${username} disconnected`);
                break;
            }
        }
    });
}