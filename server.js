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

// test endpoint
app.post('/test', (req, res) => {
  try {
    // Read the contents of the test.json file
    const testResponse = fs.readFileSync('test.json', 'utf8');

    // Convert response to textract
    const jsonData = JSON.parse(testResponse);


    // Extract text from the image
 let document = AWS.Textract().analyzeDocument(jsonData).promise();

    // get the table
    const table = document.Blocks.find(block => block.BlockType === 'TABLE');

 // get the table
 //const table = analyzeDocumentResponse.Blocks.find(block => block.BlockType === 'TABLE');

     const largestRowIndex = table.Relationships.find(r => r.Type === 'CHILD').Ids.reduce((max, id) => {
       console.log('id: ' + id);
       const block = testResponse.Blocks.find(b => b.Id === id);
       return block.rowIndex > max ? block.rowIndex : max;
     }, 0);
 
     console.log('Largest row index: ' + largestRowIndex);
 
     // print each row of the TABLE block as a single line
     // loop through each row of the table
     for (let rowIndex = 0; rowIndex <= largestRowIndex; rowIndex++) {
       // loop through each cell in the row
       for (let cellIndex = 0; cellIndex < table.ColumnCount; cellIndex++) {
         // get the cell block id
         const cellBlockId = table.Relationships.find(r => r.Type === 'CHILD').Ids.find(id => {
           const block = response.Blocks.find(b => b.Id === id);
           return block.rowIndex === rowIndex && block.columnIndex === cellIndex;
         });
 
         // get the cell block
         const cellBlock = response.Blocks.find(b => b.Id === cellBlockId);
 
         // print the text for the cell
         console.log(cellBlock.Text);
       }
     }

    // Send the test response as the JSON response
    res.json(JSON.parse(testResponse));
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the image.');
  } 
});

// Route to handle file upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Read the file from the file system
    const image = fs.readFileSync(req.file.path);

    // Extract text from the image
    const response = await extractTextFromImage(image);

    // get the table
    const table = response.Blocks.find(block => block.BlockType === 'TABLE');


    const largestRowIndex = table.Relationships.find(r => r.Type === 'CHILD').Ids.reduce((max, id) => {
      console.log('id: ' + id);
      const block = response.Blocks.find(b => b.Id === id);
      return block.rowIndex > max ? block.rowIndex : max;
    }, 0);

    console.log('Largest row index: ' + largestRowIndex);

    // print each row of the TABLE block as a single line
    // loop through each row of the table
    for (let rowIndex = 0; rowIndex <= largestRowIndex; rowIndex++) {
      // loop through each cell in the row
      for (let cellIndex = 0; cellIndex < table.ColumnCount; cellIndex++) {
        // get the cell block id
        const cellBlockId = table.Relationships.find(r => r.Type === 'CHILD').Ids.find(id => {
          const block = response.Blocks.find(b => b.Id === id);
          return block.rowIndex === rowIndex && block.columnIndex === cellIndex;
        });

        // get the cell block
        const cellBlock = response.Blocks.find(b => b.Id === cellBlockId);

        // print the text for the cell
        console.log(cellBlock.Text);
      }
    }



    /* response.Blocks.forEach(block => {
      if (block.BlockType === 'LINE') {
        console.log('Line: ' + block.Text);
      }

      if (block.BlockType === 'WORD') {
        console.log('Word: ' + block.Text);
      }

      if (block.BlockType === 'SELECTION_ELEMENT') {
        console.log('Selection element');
      }

    }); */

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
