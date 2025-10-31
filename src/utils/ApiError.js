class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null; // Placeholder for extra data (if needed)
    this.message = message;
    this.errors = errors;
    this.sucess = false;

    // If a stack trace is provided, use it; otherwise, capture automatically
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
