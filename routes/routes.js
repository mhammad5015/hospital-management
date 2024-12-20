const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// routes:
// Routes
router.get("/", (req, res) => {
//   if (!isAuthenticated) {
//     return res.redirect("/login");
//   }
  res.render("index.ejs", { title: "Home" });
});

router.get("/register", (req, res) => {
  res.render("register.ejs", { title: "Register" });
});
router.post("/register", (req, res) => {
  res.redirect("index.ejs");
});

router.get("/login", (req, res) => {
  res.render("login.ejs", { title: "Login" });
});
router.post("/login", (req, res) => {
  res.redirect("index.ejs");
});

module.exports = router;
