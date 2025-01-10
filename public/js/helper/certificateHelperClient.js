export function generateCSR(clientInfo, publicKey, privateKey) {
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