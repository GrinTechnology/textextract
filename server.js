// Import required modules

const express = require('express');
const extractionRouter = require('./src/routes/extraction.route');
const { type } = require('os');

// Load environment variables from .env file
require('dotenv').config();

// Create a new Express application
const app = express();

app.use('/', extractionRouter);

// Start the server
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});