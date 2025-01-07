const CryptoJS = require("crypto-js");

exports.encryptAES = (data, symmetricKey) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), symmetricKey).toString();
};

exports.decryptAES = (ciphertext, symmetricKey) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, symmetricKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
