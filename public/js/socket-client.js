const socket = io("http://localhost:7000");

// Listen for a reply from the server
socket.on("encriptedMessage", (data) => {
    console.log(data.message);
});

// Emit a custom event
socket.emit("message", { text: "Hello, server!" });


