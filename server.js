const dotenv = require("dotenv");

// Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}.....😀`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
