const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/User");
const nodemailer = require("nodemailer");

const nodemailerSetup = async () => {
  let transporter = await nodemailer.createTransport({
    service: "Gmail", // can switch for 'hotmail'
    auth: {
      user: "chrisjcastle93@gmail.com",
      pass: "ebnvdoxmgmwebdau",
    },
  });
  return transporter;
};

nodemailerSetup();

// Bcrypt to encrypt passwords
const bcrypt = require("bcryptjs");
const bcryptSalt = 10;

router.get("/login", (req, res, next) => {
  res.render("auth/login", { message: req.flash("error") });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
    passReqToCallback: true,
  })
);

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    res.render("auth/signup", {
      message: "Indicate username, email and password",
    });
    return;
  }
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let confirmationCode = "";
  for (let i = 0; i < 25; i++) {
    confirmationCode +=
      characters[Math.floor(Math.random() * characters.length)];
  }
  User.findOne({ username })
    .then((user) => {
      if (user) {
        return res.render("auth/signup", {
          message: "The username already exists",
        });
      } else {
      const salt = bcrypt.genSaltSync(bcryptSalt);
      return bcrypt.hashSync(password, salt);
      }
    })
    .then((hashPass) => {
      console.log('HASHPASS', hashPass)
      return User.create({
        username,
        password: hashPass,
        email,
        confirmationCode,
      });
    })
    .then((newUser) => {
      console.log("NEW USER CREATED:", newUser.username, newUser.password);
      res.redirect("/");
      return nodemailerSetup();
    })
    .then((transporter) => {
      return transporter.sendMail({
        from: "Chris Castle <chrisjcastle93@gmail.com>",
        to: "chrisjcastle93@gmail.com",
        subject: "Awesome Subject",
        text: confirmationCode,
        html: `<a href='http://localhost:3000/auth/confirm/${confirmationCode}'>Verify Email</a>`,
      });
    })
    .then((info) => console.log(info))
    .catch((err) => {
      console.log(err);
      res.render("auth/signup", { message: "Something went wrong" });
    })
})


router.get("/confirm/:confirmCode", (req, res, next) => {
  const { confirmCode } = req.params;
  User.updateOne(
    { confirmationCode: confirmCode },
    { status: "Active" },
    { new: true }
  )
    .then((foundUser) => {
      console.log(
        "User",
        foundUser.username,
        "now has status",
        foundUser.status
      );
      res.redirect("/");
    })
    .catch((err) => console.log(err));
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
