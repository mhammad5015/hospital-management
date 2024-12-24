const models = require("../models/index");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CustomError = require("../util/CustomError");

exports.getRegister = async (req, res, next) => {
  res.render("register.ejs", { title: "Register" });
};

exports.postRegister = async (req, res, next) => {
  let {
    userName,
    password,
    nationalNumber,
    age,
    job,
    phoneNum,
    residence,
    isDoctor,
  } = req.body;
  if (isDoctor !== true) {
    isDoctor = false;
  } else {
    isDoctor = true;
  }
  try {
    const hashedPass = await bcrypt.hash(password, 12);
    let userData = {
      userName: userName,
      password: hashedPass,
      nationalNumber: nationalNumber,
      age: age,
      job: job,
      phoneNum: phoneNum,
      residence: residence,
      isDoctor: isDoctor,
    };
    const user = await models.User.create(userData);
    let token = jwt.sign(
      { id: user.id, userName: user.userName },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({
      message: "user created successfully",
      data: user,
      token: token,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLogin = async (req, res, next) => {
  res.render("login.ejs", { title: "Login" });
};

exports.postLogin = async (req, res, next) => {
  const { userName, password } = req.body;
  try {
    const { userName, password } = req.body;
    let user = await models.User.findOne({ where: { userName: userName } });
    if (!user) {
      throw new CustomError("User not found", 400);
    }
    let isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new CustomError("Wrong password", 400);
    }
    let payload = {
      id: user.id,
      userName: user.userName,
    };
    let token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    return res.status(200).json({
      message: "User logged in successfully",
      data: user,
      token: token,
    });
  } catch (err) {
    next(err);
  }
};
