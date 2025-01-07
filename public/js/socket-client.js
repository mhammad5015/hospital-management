const socket = io("http://localhost:7000");

const SYMMETRIC_KEY = "83c359a79e5b1adf0dc3921c00000000";
function encryptAES(data, symmetricKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), symmetricKey).toString();
}
function decryptAES(ciphertext, symmetricKey) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, symmetricKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Send encrypted examinationRequest
const sendRequestForm = document.querySelector('.sendRequest');
sendRequestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const doctorName = document.querySelector('[name="doctorName"]').value;
    const date = document.querySelector('[name="date"]').value;
    const data = {
        doctorName: doctorName,
        date: date,
    };
    const encryptedData = encryptAES(data, SYMMETRIC_KEY);
    socket.emit('examinationRequest', encryptedData);
    alert('Examination request sent successfully!');
});

// Listen for encrypted examinationResponse
socket.on("examinationResponse", (encryptedData) => {
    try {
        const data = decryptAES(encryptedData, SYMMETRIC_KEY);
        alert(data.message);
    } catch (error) {
        console.error("Error decrypting response:", error);
    }
});
// ========================================================================
// Generate client's RSA key pair
const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
let serverPublicKey;
socket.emit("clientPublicKeyPem", publicKeyPem);
// Encrypt with the server's public key
const encryptRSA = (publicKey, message) => {
    const encrypted = publicKey.encrypt(JSON.stringify(message), 'RSA-OAEP');
    const encryptedBase64 = forge.util.encode64(encrypted);
    return encryptedBase64;
};
function decryptRSA(encryptedData) {
    const decrypted = privateKey.decrypt(forge.util.decode64(encryptedData), 'RSA-OAEP');
    return JSON.parse(decrypted);
}
socket.on("serverPublicKeyPem", (serverPublicKeyPem) => {
    serverPublicKey = forge.pki.publicKeyFromPem(serverPublicKeyPem);
});

let sessionKey;
socket.on("sessionKey", async (encryptedSessionKey) => {
    sessionKey = await decryptRSA(encryptedSessionKey);
});

const sendMedicalHistoryForm = document.querySelector(".sendMedicalHistory");
sendMedicalHistoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const diseases = document.querySelector('[name="diseases"]').value;
    const surgeries = document.querySelector('[name="surgeries"]').value;
    const medications = document.querySelector('[name="medications"]').value;
    const data = {
        diseases: diseases,
        surgeries: surgeries,
        medications: medications,
    };
    const encryptedData = await encryptAES(data, sessionKey);
    socket.emit('sendMedicalHistory', encryptedData);
    alert('Medical history sent successfully!');
});

socket.on("medicalHistoryResponse", async (encryptedData) => {
    try {
        const data = await decryptAES(encryptedData, sessionKey);
        alert(data.message);
    } catch (error) {
        console.error("Error decrypting response:", error);
    }
});

