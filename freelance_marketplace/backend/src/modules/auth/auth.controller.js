const authService = require("./auth.service");
const { asyncHandler } = require("../../common/middleware");

exports.signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.send(result);
});

exports.signin = asyncHandler(async (req, res) => {
  const payload = await authService.signin(req.body, req.session);
  res.status(200).send(payload);
});

exports.signout = asyncHandler(async (req, res) => {
  const result = authService.signout(req);
  res.status(200).send(result);
});

exports.sendVerification = asyncHandler(async (req, res) => {
  const result = await authService.sendVerificationEmail(req.body.email);
  res.json(result);
});

exports.verifyEmailCode = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmailCode(req.body.email, req.body.code);
  res.json(result);
});
