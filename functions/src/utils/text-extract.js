// Import AWS SDK
const AWS = require('../configs/aws-config');

// Create a new instance of Textract
const textract = new AWS.Textract();

// Function to extract text from image
const extractTextFromImage = async (image) => {
  const params = {
    Document: {
      Bytes: image
    },
    FeatureTypes: ["TABLES"]
  };

  try {
    const response = await textract.analyzeDocument(params).promise();
    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = extractTextFromImage;
