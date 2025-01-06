const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sequelize = require("./util/database");
const corsOptions = require("./config/corsOptions");
const cors = require("cors");
const rateLimiter = require("./middlewares/rateLimiter");
const globalErrorHandler = require("./controllers/errorController");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false })); //basically tells the system whether you want to use a simple algorithm for shallow parsig (i.e. false) or complex algorithm for deep parsing that can deal with nested objects (i.e. true).
app.use(bodyParser.json()); // basically tells the system that you want json to be used.
app.use(express.static(path.join(__dirname, "public"))); // to access the public folder from any where in the application
app.use(cors(corsOptions));
app.use(rateLimiter);
app.set("view engine", "ejs");
app.set("views", "views");
app.use(cookieParser());

const routes = require("./routes/routes");
app.use(routes);

app.use(globalErrorHandler);
const models = require("./models/index");

server = app.listen(port, "localhost", () => console.log("listening on port " + port));
// socket.io implementation:
const io = require("./socket").init(server);
io.on("connection", socket => {
    console.log("A client connected");
    socket.on("examinationRequest", async (data) => {
        let { doctorName, date } = data;
        let doctor = await models.User.findOne({ where: { userName: doctorName } })
        if (!doctor) {
            io.emit("examinationResponse", { message: `doctor not found`, statusCode: 400 })
            return;
        }
        if (doctor.isDoctor == false) {
            io.emit("examinationResponse", { message: `the user is not a doctor`, statusCode: 400 })
            return
        }
        io.emit("examinationResponse", { message: `doctor ${doctorName} is available at ${date}`, statusCode: 200 })
    })
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});