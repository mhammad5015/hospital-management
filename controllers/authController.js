const models = require("../models/index");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CustomError = require("../util/CustomError");

exports.getHome = (req, res) => {
  res.render("index", {
    title: "Home",
    user: req.user,
  });
}

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
    res.render("login", {
      message: "user created successfully",
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
    // Set the token in a cookie for authentication
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    // Redirect to the homepage
    return res.redirect("/");
  } catch (err) {
    next(err);
  }
};

exports.getLogout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
}
