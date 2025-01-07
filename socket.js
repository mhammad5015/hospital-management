const { Server } = require("socket.io");
let io;

module.exports = {
    init: httpServer => {
        io = new Server(httpServer);
        io.on("connection", require("./controllers/socketController").handleSocket);
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.IO not initialized")
        }
        return io
    }
}