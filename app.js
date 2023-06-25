// Import required dependencies
const express = require("express");
const compression = require("compression"); // External middleware for compressing responses
const helmet = require("helmet"); // External middleware for setting HTTP response headers
const morgan = require("morgan");
const cors = require("cors"); // External middleware for handling Cross-Origin Resource Sharing (CORS)
const AppError = require("./utils/appError"); // Custom error handling utility
const globalErrorHandler = require("./controllers/errorController"); // Global error handling middleware
const userRouter = require("./routes/userRoutes"); // User routes
const wineProductRouter = require("./routes/productRoutes"); // Wine product routes
const paymentRouter = require("./routes/paymentRoutes"); // Payment routes
const orderRouter = require("./routes/orderRoutes"); // Order routes
const addressRouter = require("./routes/addressRoutes"); // Address routes
const notificationRouter = require("./routes/notificationRoutes"); // Notification routes
const adminRouter = require("./routes/adminRoutes"); // Admin routes

// Create a new instance of the Express application
const app = express();

// Set the view engine to EJS
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
    },
  })
);

// Apply middleware to the application
if (process.env.NODE_ENV === "development") {
  // Log HTTP requests to the console during development only
  app.use(morgan("dev"));
}

// Compress all responses
app.use(compression());

// Parse incoming request body as JSON
app.use(express.json());

// Serve static files from a directory
app.use(express.static(`${__dirname}/public`));

// handle form data
app.use(express.urlencoded({ extended: true }));

// Add middleware that adds a `requestTime` property to the request object with the current date and time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(cors());

// {
//   origin: [
//     "https://drinksofallkind.com",
//     "https://doak-admin.netlify.app",
//     "http://localhost:3000",
//     "http://localhost:3001",
//   ], // Allow requests from this origin
// }

// Routes
// Add CORS handling middleware to allow cross-origin requests to the API
app.use("/api/v1/wine", wineProductRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("images", express.static(`${__dirname}/public/images`));

// Handle all undefined routes by throwing a custom error with a 404 status code
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Add global error handling middleware to the application
app.use(globalErrorHandler);

// Export the Express application instance
module.exports = app;
