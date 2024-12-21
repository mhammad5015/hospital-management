const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sequelize = require("./util/database");
const corsOptions = require("./config/corsOptions");
const cors = require("cors");
const rateLimiter = require("./middlewares/rateLimiter");
const globalErrorHandler = require("./controllers/errorController");

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false })); //basically tells the system whether you want to use a simple algorithm for shallow parsig (i.e. false) or complex algorithm for deep parsing that can deal with nested objects (i.e. true).
app.use(bodyParser.json()); // basically tells the system that you want json to be used.
app.use(express.static(path.join(__dirname, "public"))); // to access the public folder from any where in the application
app.use(cors(corsOptions));
app.use(rateLimiter);
app.set("view engine", "ejs");
app.set("views", "views");

const routes = require("./routes/routes");
app.use(routes);

app.use(globalErrorHandler);

app.listen(port, "localhost", () => console.log("listening on port " + port));
