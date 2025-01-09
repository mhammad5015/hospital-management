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

socket.on("CSR_response", async (data) => {
    try {
        // const data = await decryptAES(encryptedData, sessionKey);
        alert(data);
    } catch (error) {
        console.error("Error decrypting response:", error);
    }
})