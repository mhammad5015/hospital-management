import clientData from './socket-client.js';
import { SYMMETRIC_KEY, encryptAES, decryptAES } from './helper/aesHelperClient.js';
import { generateRSAKeys, encryptRSA, decryptRSA } from './helper/rsaHelperClient.js';
const { socket, privateKeyPem, publicKeyPem, publicKey, privateKey } = clientData;

// =====================================================================================
// Examination Request
// =====================================================================================
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
        console.log(data.message);
        alert(data.message);
    } catch (error) {
        console.error("Error decrypting response:\n", error);
    }
});

socket.on("appointmentConfirmationResault", (data) => {
    try {
        alert(`the appointment resault is: ${data.status}.\nthe required tests are:\n${data.requiredTests}.`)
        console.log(`the appointment resault is ${data.status}.\nthe required tests are:\n${data.requiredTests}.`);
    } catch (error) {
        console.log("Error decrypting response:\n", error);
    }
})
// =====================================================================================
// Medical History
// =====================================================================================
socket.emit("clientPublicKeyPem", publicKeyPem);

let serverPublicKey;
socket.on("serverPublicKeyPem", (serverPublicKeyPem) => {
    serverPublicKey = forge.pki.publicKeyFromPem(serverPublicKeyPem);
});

let sessionKey;
socket.on("sessionKey", async (encryptedSessionKey) => {
    sessionKey = await decryptRSA(privateKey, encryptedSessionKey);
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
