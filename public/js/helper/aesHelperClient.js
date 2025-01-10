export const SYMMETRIC_KEY = "83c359a79e5b1adf0dc3921c00000000";
export function encryptAES(data, symmetricKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), symmetricKey).toString();
}
export function decryptAES(ciphertext, symmetricKey) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, symmetricKey);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        throw new Error("Encrypt failed:\n" + error);
    }
}