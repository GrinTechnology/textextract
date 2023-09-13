const express = require('express');
const router = express.Router();
const extractionController = require('../controllers/extraction.controller');
const fileParser = require('express-multipart-file-parser')
const cors = require("cors")
// const multer = require('multer');

// Configure multer for file upload
/* const upload = multer({
    dest: 'uploads/'
  }); */

router.use(fileParser);
router.use(cors());
router.post('/test', extractionController.getTestResponse);

router.post('/extract', extractionController.getTextractResults);

// Route to handle file upload
//router.post('/upload', upload.single('image'),  extractionController.upload);
router.post('/upload', extractionController.upload);

router.post('/upload-pdf', extractionController.uploadPdf);


module.exports = router;