const { validationResult, check } = require("express-validator");
const models = require("../../models/index");
const fs = require("fs");

const userRegisterValidation = [
  check("userName", "User name is required")
    .trim()
    .notEmpty()
    .isLength({ max: 40 })
    .withMessage("The Name too Long")
    .custom((value) => {
      return models.User.findOne({ where: { userName: value } }).then(
        (userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "Email already exists, please pick a different one"
            );
          }
        }
      );
    }),
  check("password", "password is required")
    .trim()
    .notEmpty()
    .isLength({
      min: 4,
    })
    .withMessage("Password must be at least 4 characters"),
  check("confirmPassword", "confirm password is required")
    .trim()
    .notEmpty()
    .custom(async (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords must be same");
      }
    }),
  check("nationalNumber", "nationalNumber field is required").trim().notEmpty(),
  check("age", "age field is required").trim().notEmpty(),
  check("job", "job field is required").trim().notEmpty(),
  check("phoneNum", "phoneNum field is required").trim().notEmpty(),
  check("residence", "residence field is required").trim().notEmpty(),
  check("isDoctor", "isDoctor field is required").trim().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    next();
  },
];

const userLoginValidation = [
  check("userName", "User name field is required")
    .trim()
    .notEmpty()
    .isLength({ max: 40 })
    .withMessage("The Name too Long"),
  check("password", "Password is Required")
    .trim()
    .notEmpty()
    .isLength({ min: 4 })
    .withMessage("Password must be at least 6 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    next();
  },
];

module.exports = {
  userRegisterValidation,
  userLoginValidation,
};
