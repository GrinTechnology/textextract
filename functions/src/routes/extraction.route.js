const express = require('express');
const router = express.Router();
const extractionController = require('../controllers/extraction.controller');
const fileParser = require('express-multipart-file-parser')
// const multer = require('multer');

// Configure multer for file upload
/* const upload = multer({
    dest: 'uploads/'
  }); */

router.post('/test', extractionController.getTestResponse);


router.use(fileParser);
// Route to handle file upload
//router.post('/upload', upload.single('image'),  extractionController.upload);
router.post('/upload', extractionController.upload);


module.exports = router;