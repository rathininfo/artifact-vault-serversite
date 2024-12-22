const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); // Corrected from "dotnv" to "dotenv"
const app = express();
dotenv.config();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Test Route
app.get("/", (req, res) => {
  res.send("Server Is connected");
});

// Start Server
app.listen(port, () => {
  console.log(`The Server is running on port ${port}`);
});
