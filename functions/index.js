// Import required modules

const functions = require('firebase-functions');
const express = require('express');
const extractionRouter = require('./src/routes/extraction.route');
const cors = require("cors")
const { onRequest } = require("firebase-functions/v2/https");

// Create a new Express application
const app = express();

app.use(cors());
app.use('/', extractionRouter);

// Start the server
const port = process.env.OUT_PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

exports.app = onRequest(
  { cors: true},
  app
);