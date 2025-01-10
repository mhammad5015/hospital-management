import clientData from './socket-client.js';
import { SYMMETRIC_KEY, encryptAES, decryptAES } from './helper/aesHelperClient.js';
import { generateRSAKeys, encryptRSA, decryptRSA } from './helper/rsaHelperClient.js';
import { generateCSR } from './helper/certificateHelperClient.js'
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

socket.on("chalangeStatus", (data) => {
    try {
        alert(data.message)
        if (data.certificate !== null) {
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