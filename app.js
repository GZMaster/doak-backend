// Import required dependencies
const express = require("express");
const morgan = require("morgan");
const cors = require("cors"); // External middleware for handling Cross-Origin Resource Sharing (CORS)
const AppError = require("./utils/appError"); // Custom error handling utility
const globalErrorHandler = require("./controllers/errorController"); // Global error handling middleware

// Create a new instance of the Express application
const app = express();

// Apply middleware to the application
if (process.env.NODE_ENV === "development") {
  // Log HTTP requests to the console during development only
  app.use(morgan("dev"));
}

// Parse incoming request body as JSON
app.use(express.json());

// Serve static files from a directory
app.use(express.static(`${__dirname}/public`));

// Add middleware that adds a `requestTime` property to the request object with the current date and time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Add CORS handling middleware to allow cross-origin requests to the API
app.use("/api/v1/", cors());

// Handle all undefined routes by throwing a custom error with a 404 status code
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Add global error handling middleware to the application
app.use(globalErrorHandler);

// Export the Express application instance
module.exports = app;
