import clientData from './socket-client.js';
const { socket, privateKeyPem, publicKeyPem, publicKey, privateKey } = clientData;

const SYMMETRIC_KEY = "83c359a79e5b1adf0dc3921c00000000";
function encryptAES(data, symmetricKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), symmetricKey).toString();
}
function decryptAES(ciphertext, symmetricKey) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, symmetricKey);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        throw new Error("Encrypt failed:\n" + error);
    }

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