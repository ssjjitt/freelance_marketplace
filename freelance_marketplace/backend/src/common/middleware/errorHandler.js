function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).send({ message });
}

module.exports = { errorHandler };
