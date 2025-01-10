const socket = io("http://localhost:7000");

const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

socket.emit("registerUser", userName);

export default {
    socket,
    privateKeyPem,
    publicKeyPem,
    publicKey,
    privateKey,
};