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

// deprecated
router.post('/upload-pdf', extractionController.getCdtCodes);

router.post('/codes', extractionController.getCdtCodes);

router.post('/details', extractionController.getPlanDetails);

module.exports = router;