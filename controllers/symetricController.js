require("dotenv").config();
const { decryptAES, encryptAES } = require("../util/security/aesHelper");
const models = require("../models/index");

exports.handleRequest = async (socket, encryptedData) => {
    try {
        const data = decryptAES(encryptedData, process.env.ENCRYPTION_KEY);
        const { doctorName, date } = data;

        const doctor = await models.User.findOne({ where: { userName: doctorName } });
        let response;

        if (!doctor) {
            response = { message: "Doctor not found", statusCode: 400 };
        } else if (!doctor.isDoctor) {
            response = { message: "The user is not a doctor", statusCode: 400 };
        } else {
            response = { message: `Doctor ${doctorName} is available at ${date}`, statusCode: 200 };
        }

        const encryptedResponse = encryptAES(response, process.env.ENCRYPTION_KEY);
        socket.emit("examinationResponse", encryptedResponse);
    } catch (error) {
        console.error("Error processing examination request:", error);
    }
};
