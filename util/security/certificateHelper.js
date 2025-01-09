const forge = require('node-forge');
const crypto = require('crypto');

function issueCertificate(csrPem, CA_PrivateKeyPem, CA_CertificatePem) {
    try {
        const csr = forge.pki.certificationRequestFromPem(csrPem);
        if (!csr.verify()) {
            throw new Error("CSR verification failed.");
        }

        const CA_PrivateKey = forge.pki.privateKeyFromPem(CA_PrivateKeyPem);
        const CA_Certificate = forge.pki.certificateFromPem(CA_CertificatePem);

        const certificate = forge.pki.createCertificate();
        certificate.serialNumber = generateUniqueSerialNumber();
        certificate.validity.notBefore = new Date();
        certificate.validity.notAfter = new Date();
        certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 1);

        certificate.setSubject(csr.subject.attributes);
        certificate.setIssuer(CA_Certificate.subject.attributes);
        certificate.publicKey = csr.publicKey;

        certificate.sign(CA_PrivateKey);

        return forge.pki.certificateToPem(certificate);
    } catch (err) {
        console.error("Error issuing certificate:", err);
        return null;
    }
}

function validateCertificate(certificatePem, CA_CertificatePem) {
    const certificate = forge.pki.certificateFromPem(certificatePem);
    const CA_Certificate = forge.pki.certificateFromPem(CA_CertificatePem);
    return CA_Certificate.verify(certificate);
}

function generateCACertificate() {
    const caKeys = forge.pki.rsa.generateKeyPair(2048);
    const CA_Certificate = forge.pki.createCertificate();
    CA_Certificate.publicKey = caKeys.publicKey;
    CA_Certificate.setSubject([{ name: 'commonName', value: 'Syrian Ministry of Health' }]);
    CA_Certificate.setIssuer(CA_Certificate.subject.attributes);
    CA_Certificate.serialNumber = generateUniqueSerialNumber();
    CA_Certificate.validity.notBefore = new Date();
    CA_Certificate.validity.notAfter = new Date();
    CA_Certificate.validity.notAfter.setFullYear(CA_Certificate.validity.notBefore.getFullYear() + 5);
    CA_Certificate.sign(caKeys.privateKey);

    return {
        privateKeyPem: forge.pki.privateKeyToPem(caKeys.privateKey),
        certificatePem: forge.pki.certificateToPem(CA_Certificate),
    };
}

function generateUniqueSerialNumber() {
    return crypto.randomBytes(16).toString('hex'); // Generates a 128-bit unique serial number
}

module.exports = {
    issueCertificate,
    validateCertificate,
    generateCACertificate,
};
