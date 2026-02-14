// Middleware for handling 404 Not Found errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error to the next middleware (our errorHandler)
};

// General error handling middleware
// This catches any error that occurs in our routes
import fs from 'fs';
import path from 'path';

// General error handling middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log to console
  console.error('❌ Error Middleware Caught:', err.message);
  
  // Log to file
  try {
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync('error.log', logMessage);
  } catch (logErr) {
    console.error('Failed to write to error.log:', logErr.message);
  }

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export { notFound, errorHandler };