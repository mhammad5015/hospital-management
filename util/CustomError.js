class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // client error => fail
    // server error => error
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    this.isOperetional = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;
