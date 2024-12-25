module.exports = (error, req, res, next) => {
  console.error(error.stack);

  // error.statusCode = error.statusCode || 500;
  // error.status = error.status || "error";

  res.status(error.statusCode);
  // Render the error page or send JSON response depending on request type
  if (req.accepts("html")) {
    res.render("error", { error: error }); // Render error EJS template
  } else {
    res.json({ message: error.message, status: error.status }); // JSON response
  }
  // .json({
  //   status: error.statusCode,
  //   message: error.message,
  // });
};
// module.exports = (error, req, res, next) => {
//   error.statusCode = error.statusCode || 500;
//   error.status = error.status || "error";

//   const response = {
//     status: error.statusCode,
//     message: error.message,
//   };

//   // Include the error line in the response if in development mode
//   if (process.env.NODE_ENV === "development") {
//     // Get the stack trace
//     const stackLines = error.stack.split("\n");

//     // Extract the line that points to the source file and line number
//     const errorLine = stackLines[1].trim();
//     response.stack = errorLine;
//   }

//   res.status(error.statusCode).json(response);
// };
