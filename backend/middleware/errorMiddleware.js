// Middleware for handling 404 Not Found errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error to the next middleware (our errorHandler)
};

// General error handling middleware
// This catches any error that occurs in our routes
const errorHandler = (err, req, res, next) => {
  // Sometimes errors come with a status code, if not, default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  
  res.json({
    message: err.message,
    // Include stack trace only if in development mode
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export { notFound, errorHandler };