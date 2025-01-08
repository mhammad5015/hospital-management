import socket from "./socket-client.js"

const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

socket.emit("clientPublicKeyPem", publicKeyPem);

const sendAppointmentConfirmationForm = document.querySelector(".appointmentConfirmation");
sendAppointmentConfirmationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const requiredTests = document.querySelector('[name="requiredTests"]').value;
    const data = {
        requiredTests: requiredTests,
    };
    const signature = signMessage(data, privateKeyPem);
    const all = {
        signature: signature,
        message: data
    }
    socket.emit('sendAppointmentConfirmation', all);
    alert('Appointment Confirmation sent successfully!');
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
