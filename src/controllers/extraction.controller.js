const fs = require('fs');
const extractTextFromImage = require('../utils/text-extract');

async function getTestResponse(req, res, next) {

    try {
        // Read the contents of the test.json file
        // test-1: Dwight
        // test-2: Elishea

        const testResponse = fs.readFileSync('sample-plans/test-2.json', 'utf8');

        // Convert response to textract
        const jsonData = JSON.parse(testResponse);

        // Extract text from the image
        let document = jsonData;

        // get the table
        const table = document.Blocks.find(block => block.BlockType === 'TABLE');

        const largestRowIndex = table.Relationships.find(r => r.Type === 'CHILD').Ids.reduce((max, id) => {
            const block = document.Blocks.find(b => b.Id === id);
            return block.RowIndex > max ? block.RowIndex : max;
        }, 0);

        const largestColumnIndex = table.Relationships.find(r => r.Type === 'CHILD').Ids.reduce((max, id) => {
            const block = document.Blocks.find(b => b.Id === id);
            return block.ColumnIndex > max ? block.ColumnIndex : max;
        }, 0);

        console.log('Largest row index: ' + largestRowIndex);
        console.log('Largest column index: ' + largestColumnIndex);

        // Create a map to store each table row as a comma separated list
        const tableRows = [];

        // Loop through each row of the table
        for (let rowIndex = 0; rowIndex <= largestRowIndex; rowIndex++) {
            // Loop through each cell in the row
            const rowValues = [];
            for (let cellIndex = 0; cellIndex < largestColumnIndex; cellIndex++) {
                // Get the cell block id
                const cellBlockId = table.Relationships.find(r => r.Type === 'CHILD').Ids.find(id => {
                    const block = document.Blocks.find(b => b.Id === id);
                    return block.RowIndex === rowIndex && block.ColumnIndex === cellIndex;
                });

                // Get the cell block
                const cellBlock = document.Blocks.find(b => b.Id === cellBlockId);

                if (typeof (cellBlock) === 'undefined') {
                    console.log('Cell is undefined');
                    rowValues.push(' ');
                    continue;
                }

                if (typeof (cellBlock.Relationships) === 'undefined') {
                    console.log('Cell relationships are undefined');
                    continue;
                }

                if (cellBlock.BlockType === 'CELL') {
                    let childrenIds = cellBlock.Relationships.find(r => r.Type === 'CHILD').Ids;

                    // Turn children into an array
                    childrenIds = Array.isArray(childrenIds) ? childrenIds : [childrenIds];

                    const childrenText = childrenIds.map(id => {
                        const cellChild = document.Blocks.find(b => b.Id === id);
                        if (cellChild.Text !== '' && typeof (cellChild.Text) !== 'undefined') {
                            return ' ' + cellChild.Text;
                        }
                        return '';
                    }).join('');

                    // trim the text
                    let trimmedText = childrenText.trim();

                    // remove commas
                    trimmedText = trimmedText.replace(/,/g, '');

                    if (trimmedText !== '') {
                        rowValues.push(trimmedText);
                    }
                }

            }

            // Convert the row values to a comma separated list
            const row = rowValues.join(',');

            // Add the row to the table rows map
            tableRows.push(row);
        }

        console.log('Table Rows:', tableRows);

        // Send the test response as the JSON response
        res.json(JSON.parse(testResponse));
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing the image.');

    }
}

async function upload(req, res, next) {
    try {

        if (typeof req.file != 'undefined') {
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
    
          // Send the response
          res.json(response);
        }
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing the image.');
      } finally {
        if (typeof req.file != 'undefined') {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
        }
      }
}

// Export the controller functions
module.exports = {
    getTestResponse, 
    upload
};