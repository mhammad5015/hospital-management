const { encryptAES, decryptAES } = require("../util/security/aesHelper");

exports.handleMedicalHistory = async (socket, encryptedData) => {
    try {
        // Decrypt the incoming data with the session key
        const decryptedData = decryptAES(encryptedData, socket.sessionKey);
        // Extract the medical history details
        const { diseases, surgeries, medications } = decryptedData;
        console.log("Received medical history:", { diseases, surgeries, medications });
        // Prepare a success response
        const response = {
            message: "Medical history received successfully",
            statusCode: 200,
        };
        // Encrypt the response and send it back to the client
        const encryptedResponse = encryptAES(response, socket.sessionKey);
        socket.emit("medicalHistoryResponse", encryptedResponse);
    } catch (error) {
        console.error("Error processing medical history:", error);
        // Prepare an error response in case of failure
        const response = {
            message: "Failed to process medical history",
            statusCode: 500,
        };
        // Encrypt and send the error response
        const encryptedResponse = encryptAES(response, socket.sessionKey);
        socket.emit("medicalHistoryResponse", encryptedResponse);
    }
};
