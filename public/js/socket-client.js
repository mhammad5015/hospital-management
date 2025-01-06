const socket = io("http://localhost:7000");

const ENCRYPTION_KEY = "your-secret-key";
function encrypt(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}
function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
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
    const encryptedData = encrypt(data); // Encrypt the data before sending
    socket.emit('examinationRequest', encryptedData);
    alert('Examination request sent successfully!');
});

// Listen for encrypted examinationResponse
socket.on("examinationResponse", (encryptedData) => {
    try {
        const data = decrypt(encryptedData); // Decrypt the incoming data
        alert(data.message);
    } catch (error) {
        console.error("Error decrypting response:", error);
    }
});