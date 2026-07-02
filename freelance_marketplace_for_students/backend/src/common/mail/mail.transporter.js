const nodemailer = require("nodemailer");
const config = require("../../config");

function createMailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

module.exports = { createMailTransporter };
