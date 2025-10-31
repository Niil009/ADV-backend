// Async error handler using Promise
const asyncHandler = (requestHandler) => {
  // Return a middleware function
  return (req, res, next) => {
    // Execute the handler and catch any async errors
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)); // Pass error to Express error handler
  };
};

export { asyncHandler };
// Try catch one
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       sucess: fase,
//       message: err.message,
//     });
//   }
// };
