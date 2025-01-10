require("dotenv").config();
const { decryptAES, encryptAES } = require("../util/security/aesHelper");
const models = require("../models/index");
const io = require("../socket").getIO();

exports.handleRequest = async (socket, encryptedData, userSocketMap) => {
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
            response = { message: `Doctor ${doctorName} recived the examination request`, statusCode: 200 };
            // Emit to the specific doctor
            const doctorSocketId = userSocketMap.get(doctorName);
            if (doctorSocketId) {
                // store the request in the database????
                const examinationData = {
                    message: `patient ${socket.userName} requested for exmination on ${date} `,
                    date: date,
                    username: socket.userName
                };
                const encryptedExaminationData = encryptAES(examinationData, process.env.ENCRYPTION_KEY);
                io.to(doctorSocketId).emit("getExaminationReq", encryptedExaminationData);
            } else {
                response = { message: `Doctor ${doctorName} is not connected.`, statusCode: 400 };
            }
        }

        const encryptedResponse = encryptAES(response, process.env.ENCRYPTION_KEY);
        socket.emit("examinationResponse", encryptedResponse);
    } catch (error) {
        console.error("Error processing examination request:", error);
    }
};
