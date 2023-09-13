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
    // Print the result
    console.log('Textract response: ' + response);
    return response;
  } catch (error) {
    console.error('error in extractTextFromImage: ' + error.message);
    return null;
  }
};

// Function to extract all text from the document and return it as a text blob
// Omit the values that were extracted from the table
function extractText(document) {
  // Get the text blocks
  const textBlocks = document.Blocks.filter(block => block.BlockType != 'LINE');

  // Get the table
  const table = document.Blocks.find(block => block.BlockType === 'TABLE');

  // Get the list of IDs in the table
  // only do this if Relationships exists
  if (typeof (table.Relationships) === 'undefined') {
    return '';
  } else {
    const tableIds = table.Relationships.find(r => r.Type === 'CHILD').Ids;


    // Get the child IDs for each table child
    const tableChildIds = tableIds.map(id => {
      const block = document.Blocks.find(b => b.Id === id);

      if (typeof (block) != 'undefined' && typeof (block.Relationships) != 'undefined') {
        return block.Relationships.find(r => r.Type === 'CHILD').Ids;
      }
    });


    // Convert the IDs to an array
    const tableIdArray = Array.isArray(tableChildIds) ? tableChildIds : [tableChildIds];
    const flatIds = tableIdArray.flat();


    // Log the list of IDs
    // console.log('Table IDs:', flatIds);

    // Remove the table blocks from the text blocks
    const filteredTextBlocks = textBlocks.filter(block => !flatIds.includes(block.Id));

    // Extract the text from each block
    const textBlob = filteredTextBlocks.map(block => block.Text).join(' ');

    return textBlob;
  }
}


// Reusable function to extract table rows from a document
function extractTableRows(document) {
  // Get the table
  const tables = document.Blocks.filter(block => block.BlockType === 'TABLE');

  // Create a map to store each table as a string
  const fullTables = new Map();

  tables.forEach(table => {

    // console.log('Table ID:', table.Id);

    // Find the largest row index
    const largestRowIndex = table.Relationships.find(r => r.Type === 'CHILD').Ids.reduce((max, id) => {
      const block = document.Blocks.find(b => b.Id === id);
      return block.RowIndex > max ? block.RowIndex : max;
    }, 0);

    // Find the largest column index
    const largestColumnIndex = table.Relationships.find(r => r.Type === 'CHILD').Ids.reduce((max, id) => {
      const block = document.Blocks.find(b => b.Id === id);
      return block.ColumnIndex > max ? block.ColumnIndex : max;
    }, 0);

    console.log('Largest row index: ' + largestRowIndex);
    console.log('Largest column index: ' + largestColumnIndex);

    // Create a map to store each table row as a comma separated list
    const tableRows = [];

    // Loop through each row of the table
    for (let rowIndex = 1; rowIndex <= (largestRowIndex + 1); rowIndex++) {
      // Loop through each cell in the row
      const rowValues = [];
      for (let cellIndex = 1; cellIndex < (largestColumnIndex + 1); cellIndex++) {

        // Get the cell block id
        const tableChildIds = table.Relationships.find(r => r.Type === 'CHILD').Ids;

        const cellBlockId = tableChildIds.find(id => {
          const block = document.Blocks.find(b => b.Id === id);
          return block.RowIndex === rowIndex && block.ColumnIndex === cellIndex;
        });


        // console.log('Cell block ID:', cellBlockId);
        // Get the cell block
        const cellBlock = document.Blocks.find(b => b.Id === cellBlockId);

        if (typeof (cellBlock) === 'undefined') {
          // console.log('Cell is undefined');
          rowValues.push(' ');
          continue;
        }

        if (typeof (cellBlock.Relationships) === 'undefined') {
          // console.log('Cell relationships are undefined');
          continue;
        }

        if (cellBlock.BlockType === 'CELL') {
          let childrenIds = cellBlock.Relationships.filter(r => r.Type === 'CHILD').map(r => r.Ids).flat();

          // console.log('Children IDs:', childrenIds);

          // Turn children into an array
          childrenIds = Array.isArray(childrenIds) ? childrenIds : [childrenIds];

          const childrenText = childrenIds.map(id => {
            const cellChild = document.Blocks.find(b => b.Id === id);
            if (typeof (cellChild.Text) !== 'undefined' && cellChild.Text !== '') {
              return ' ' + cellChild.Text;
            }
            return '';
          }).join('');

          // Trim the text
          let trimmedText = childrenText.trim();

          // Remove commas
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

    fullTables.set(table.Id, tableRows);
  });

  // Convert the fullTables map to a structured string
  const structuredString = JSON.stringify([...fullTables]);

  // Return the structured string
  return structuredString;

}

module.exports = {
  extractTextFromImage,
  extractText,
  extractTableRows
}
