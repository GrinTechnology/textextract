const express = require('express');
const router = express.Router();
const extractionController = require('../controllers/extraction.controller');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/'
  });

router.post('/test', extractionController.getTestResponse);

// Route to handle file upload
router.post('/upload', upload.single('image'),  extractionController.getTestResponse);

module.exports = router;