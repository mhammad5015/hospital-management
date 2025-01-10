export function generateRSAKeys() {
    const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
    return {
        privateKey,
        publicKey,
        privateKeyPem: forge.pki.privateKeyToPem(privateKey),
        publicKeyPem: forge.pki.publicKeyToPem(publicKey),
    };
};

export function encryptRSA(publicKey, message) {
    const encrypted = publicKey.encrypt(JSON.stringify(message), 'RSA-OAEP');
    const encryptedBase64 = forge.util.encode64(encrypted);
    return encryptedBase64;
}

export function decryptRSA(privateKey, encryptedData) {
    const decrypted = privateKey.decrypt(forge.util.decode64(encryptedData), 'RSA-OAEP');
    return JSON.parse(decrypted);
}
