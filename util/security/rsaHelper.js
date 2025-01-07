const forge = require("node-forge");

exports.generateRSAKeys = () => {
    const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair(2048);
    return {
        privateKey,
        publicKey,
        privateKeyPem: forge.pki.privateKeyToPem(privateKey),
        publicKeyPem: forge.pki.publicKeyToPem(publicKey),
    };
};

exports.encryptRSA = (publicKey, data) => {
    const encrypted = publicKey.encrypt(JSON.stringify(data), "RSA-OAEP");
    return forge.util.encode64(encrypted);
};

exports.decryptRSA = (privateKey, encryptedData) => {
    const decrypted = privateKey.decrypt(forge.util.decode64(encryptedData), "RSA-OAEP");
    return JSON.parse(decrypted);
};
