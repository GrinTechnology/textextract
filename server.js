// Import required modules
const express = require('express');
const AWS = require('./aws-config');
const extractTextFromImage = require('./text-extract');
const fs = require('fs');
const multer = require('multer');

// Load environment variables from .env file
require('dotenv').config();

// Create a new Express application
const app = express();

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/'
});

// Route to handle file upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Read the file from the file system
    const image = fs.readFileSync(req.file.path);

    // Extract text from the image
    const response = await extractTextFromImage(image);

    // Send the response
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the image.');
  } finally {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
