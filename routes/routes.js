const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authValidation = require("../middlewares/validators/authValidationMiddleware");
const isUser = require("../middlewares/Authentication/userAuthMiddleware");

router.get("/", isUser, (req, res) => {
  //   if (!isAuthenticated) {
  //     return res.redirect("/login");
  //   }
  res.render("index.ejs", { title: "Home" });
});

router.get("/register", authController.getRegister);
router.post(
  "/register",
  authValidation.userRegisterValidation,
  authController.postRegister
);

router.get("/login", authController.getLogin);
router.post(
  "/login",
  authValidation.userLoginValidation,
  authController.postLogin
);

module.exports = router;
