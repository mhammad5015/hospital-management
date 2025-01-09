import clientData from './socket-client.js';

const { socket, privateKeyPem, publicKeyPem, publicKey, privateKey } = clientData;

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
    const csrPem = await generateCSR(clientInfo);
    socket.emit("CSR", csrPem);
    console.log("client csrPem:\n" + csrPem);
    alert('CSR sent successfully!');
});
function generateCSR(clientInfo) {
    try {
        const csr = forge.pki.createCertificationRequest();
        csr.publicKey = publicKey;
        csr.setSubject([
            { name: 'commonName', value: clientInfo.commonName },
            { name: 'organizationName', value: clientInfo.organizationName },
            { name: 'countryName', value: clientInfo.countryName },
        ]);
        csr.sign(privateKey);
        const csrPem = forge.pki.certificationRequestToPem(csr);
        return csrPem;
    } catch (error) {
        console.error("Error generating CSR:", error);
        alert("Failed to generate CSR.");
        throw error;
    }
}
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
            socket.emit("math_result", Number(answer));
            mathDiv.remove(); // Remove the math challenge after submission
            alert("Answer sent to the server!");
        });
    } catch (error) {
        console.error("Error handling math challenge:", error);
    }
});

socket.on("result_status", (data) => {
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