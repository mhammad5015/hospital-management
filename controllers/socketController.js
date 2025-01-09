require("dotenv").config();
const fs = require("fs");
const models = require("../models/index");
const forge = require('node-forge');
const crypto = require("crypto");

const { generateRSAKeys, encryptRSA, decryptRSA } = require("../util/security/rsaHelper");
const { encryptAES, decryptAES } = require("../util/security/aesHelper");
const { signMessage, verifyMessage } = require("../util/security/digitalSignatureHelper");
const symetricController = require("./symetricController");
const pgpController = require("./pgpController");
const { emit } = require("process");

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



function issueCertificate(csrPem, caPrivateKeyPem, caCertificatePem) {
    try {
        const csr = forge.pki.certificationRequestFromPem(csrPem);
        if (!csr.verify()) {
            throw new Error("CSR verification failed.");
        }

        // Verify doctor's identity by issuing a challenge (e.g., solve a math problem)
        const challenge = "Solve 2 + 2 * 5";
        const correctAnswer = "12"; // Hardcoded for simplicity, replace with dynamic checks

        // After doctor solves the challenge correctly, issue the certificate
        const caPrivateKey = forge.pki.privateKeyFromPem(caPrivateKeyPem);
        const caCertificate = forge.pki.certificateFromPem(caCertificatePem);

        const certificate = forge.pki.createCertificate();
        certificate.serialNumber = "01";
        certificate.validity.notBefore = new Date();
        certificate.validity.notAfter = new Date();
        certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 1);

        certificate.setSubject(csr.subject.attributes);
        certificate.setIssuer(caCertificate.subject.attributes);
        certificate.publicKey = csr.publicKey;

        certificate.sign(caPrivateKey);

        return forge.pki.certificateToPem(certificate);
    } catch (err) {
        console.log(err);
    }
}

// CA's key pair and self-signed certificate (pre-generated)
const caKeys = forge.pki.rsa.generateKeyPair(2048);
const caCertificate = forge.pki.createCertificate();
caCertificate.publicKey = caKeys.publicKey;
caCertificate.setSubject([{ name: 'commonName', value: 'Syrian Ministry of Health' }]);
caCertificate.setIssuer(caCertificate.subject.attributes);
caCertificate.serialNumber = '01';
caCertificate.validity.notBefore = new Date();
caCertificate.validity.notAfter = new Date();
caCertificate.validity.notAfter.setFullYear(caCertificate.validity.notBefore.getFullYear() + 5);
caCertificate.sign(caKeys.privateKey);

const caPrivateKeyPem = forge.pki.privateKeyToPem(caKeys.privateKey);
const caCertificatePem = forge.pki.certificateToPem(caCertificate);


exports.handleSocket = (socket) => {
    console.log("A client connected");
    // Send the public key to the clients for encryption
    socket.emit("serverPublicKeyPem", publicKeyPem);

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
        symetricController.handleRequest(socket, encryptedData)
    );

    socket.on("sendMedicalHistory", (encryptedData) =>
        pgpController.handleMedicalHistory(socket, encryptedData)
    );

    socket.on("sendAppointmentConfirmation", (all) => {
        const isVerified = verifyMessage(all.message, all.signature, socket.clientPublicKeyPem);
        console.log("Is the signature valid?", isVerified);
        socket.emit("appointmentConfirmationResponse", `Is the signature valid? ${isVerified}`);
    })

    // CA Verifies CSR and Issues Certificate
    socket.on("CSR", (csrPem) => {
        const issuedCertificatePem = issueCertificate(csrPem, caPrivateKeyPem, caCertificatePem);
        console.log("Issued Certificate:\n", issuedCertificatePem);
        const csr = forge.pki.certificateFromPem(issuedCertificatePem);
        // certification request content
        console.log(csr.subject.attributes);
        socket.emit("CSR_response", "Certificate Issued successfully.")
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
}