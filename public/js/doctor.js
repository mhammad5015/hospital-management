import clientData from './socket-client.js';
import { SYMMETRIC_KEY, encryptAES, decryptAES } from './helper/aesHelperClient.js';
import { signMessage, verifyMessage } from './helper/digitalSignatureHelperClient.js'
import { generateCSR } from './helper/certificateHelperClient.js'
import { generateRSAKeys, encryptRSA, decryptRSA } from './helper/rsaHelperClient.js';
const { socket, privateKeyPem, publicKeyPem, publicKey, privateKey } = clientData;

socket.emit("clientPublicKeyPem", publicKeyPem);

// =====================================================================================
// Appointment Confirmation
// =====================================================================================
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

socket.on("getExaminationReq", (encryptedData) => {
    try {
        const data = decryptAES(encryptedData, SYMMETRIC_KEY);
        alert(data.message);
        console.log(`Examination Request from ${data.username} at ${data.date}`);
    } catch (error) {
        console.error("Error decrypting response:\n", error);
    }
})
// =====================================================================================
// Certificate
// =====================================================================================
const CSRForm = document.querySelector(".CSRForm");
CSRForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const commonName = document.querySelector('[name="commonName"]').value;
    const organizationName = document.querySelector('[name="organizationName"]').value;
    const countryName = document.querySelector('[name="countryName"]').value;
    const clientInfo = {
        commonName: commonName,
        organizationName: organizationName,
        countryName: countryName,
    };
    const csrPem = await generateCSR(clientInfo, publicKey, privateKey);
    socket.emit("CSR", csrPem);
    console.log("client csrPem:\n" + csrPem);
    alert('CSR sent successfully!');
});

// Handle the CSR response with a math challenge
socket.on("CSR_response", (data) => {
    try {
        alert(data.message);
        // Assuming data contains a math operation, e.g., "5 + 3"
        const mathDiv = document.createElement("div");
        mathDiv.className = "mathChallenge";
        mathDiv.innerHTML = `
            <h3>Solve this challenge:</h3>
            <p>${data.operation}</p>
            <form class="mathForm">
                <label for="mathAnswer">Answer:</label>
                <input type="number" id="mathAnswer" required>
                <button type="submit">Submit Answer</button>
            </form>
        `;
        document.body.appendChild(mathDiv);
        const mathForm = mathDiv.querySelector(".mathForm");
        mathForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const answer = document.querySelector("#mathAnswer").value;
            socket.emit("mathChalange", Number(answer));
            mathDiv.remove(); // Remove the math challenge after submission
            alert("Answer sent to the server!");
        });
    } catch (error) {
        console.error("Error handling math challenge:", error);
    }
});

let certificatePem;
socket.on("chalangeStatus", (data) => {
    try {
        alert(data.message)
        if (data.certificate !== null) {
            certificatePem = data.certificate;
            // Select or create a container for the certificate
            let certificateDiv = document.querySelector("#certificateContainer");
            if (!certificateDiv) {
                // Create the container if it doesn't exist
                certificateDiv = document.createElement("div");
                certificateDiv.id = "certificateContainer";
                document.body.appendChild(certificateDiv);
            }
            // Update the container with the certificate
            certificateDiv.innerHTML = `
                <h3>Generated Certificate</h3>
                <pre>${data.certificate}</pre>
            `;
        }
    } catch (error) {
        console.log("Error in result_status:", error);
    }
})
// =====================================================================================
// Digital Certificates, RSA Encryption, and Digital Signatures
// =====================================================================================
let serverPublicKey;
socket.on("serverPublicKeyPem", (serverPublicKeyPem) => {
    serverPublicKey = forge.pki.publicKeyFromPem(serverPublicKeyPem);
    const sendFinalRequestForm = document.querySelector(".sendFinalRequest");
    sendFinalRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = document.querySelector('[name="message"]').value;
        const encryptedMessage = encryptRSA(serverPublicKey, message)
        const signedMessage = signMessage(message, privateKeyPem);
        const reqData = {
            encryptedMessage: encryptedMessage,
            signedMessage: signedMessage,
            certificatePem: certificatePem
        }
        socket.emit("sendFinalRequest", reqData);
        alert('message sent successfully!');
    });
});

socket.on("sendFinalResponse", (data) => {
    try {
        alert(data);
    } catch (error) {
        console.log("error with reciving" + error);
    }
})