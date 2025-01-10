import clientData from './socket-client.js';

const { socket, privateKeyPem, publicKeyPem, publicKey, privateKey } = clientData;
const SYMMETRIC_KEY = "83c359a79e5b1adf0dc3921c00000000";

function encryptAES(data, symmetricKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), symmetricKey).toString();
}
function decryptAES(ciphertext, symmetricKey) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, symmetricKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

socket.emit("clientPublicKeyPem", publicKeyPem);

const sendAppointmentConfirmationForm = document.querySelector(".appointmentConfirmation");
sendAppointmentConfirmationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const requiredTests = document.querySelector('[name="requiredTests"]').value;
    const patientName = document.querySelector('[name="patientName"]').value;
    const status = document.querySelector('[name="status"]').value;
    const data = {
        patientName: patientName,
        requiredTests: requiredTests,
        status: status
    };
    const signature = signMessage(data, privateKeyPem);
    const all = {
        signature: signature,
        // message: data
        data: data
    }
    socket.emit('sendAppointmentConfirmation', all);
    alert('Appointment Confirmation sent successfully!');
})

socket.on("appointmentConfirmationResponse", (data) => {
    try {
        alert(data);
    } catch (error) {
        console.error("Error decrypting response:", error);
    }
})

function signMessage(message, privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    // Hash the message using SHA-256
    const md = forge.md.sha256.create();
    md.update(message, 'utf8');
    // Sign the hash using the private key
    const signature = privateKey.sign(md, 'RSASSA-PKCS1-V1_5');
    const signatureBase64 = forge.util.encode64(signature); // Convert to Base64
    return signatureBase64;
}

function verifyMessage(message, signatureBase64, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // Decode the Base64 signature
    const signature = forge.util.decode64(signatureBase64);

    // Hash the message using SHA-256
    const md = forge.md.sha256.create();
    md.update(message, 'utf8');

    // Verify the signature using the public key
    const isValid = publicKey.verify(md.digest().bytes(), signature);
    return isValid;
}

socket.on("getExaminationReq", (encryptedData) => {
    try {
        const data = decryptAES(encryptedData, SYMMETRIC_KEY);
        alert(data.message);
        console.log(`Examination Request from ${data.username} at ${data.date}`);
    } catch (error) {
        console.error("Error decrypting response:\n", error);
    }
})
