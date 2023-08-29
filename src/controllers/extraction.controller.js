const fs = require('fs');
const extractTextFromImage = require('../utils/text-extract');
const https = require("https");
const querystring = require('querystring');
const axios = require('axios');

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

        // Get the table rows
        const tableRows = extractTableRows(document);

        // Get all text
        const text = extractText(document);

        console.log('Table Rows:', tableRows);
        console.log('Text:', text);

        let prompt = createPrompt(text, tableRows.join('\n'));
        let data = await makeCompletionsRequest(prompt);

        // Send the test response as the JSON response
        // res.json(JSON.parse(testResponse));

        // Send the OpenAI response as the JSON response
        res.json(data);
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
            const document = await extractTextFromImage(image);

            // Get the table rows
            const tableRows = extractTableRows(document);

            // Get all text
            const text = extractText(document);

            console.log('Table Rows:', tableRows);
            console.log('Text:', text);

            let prompt = createPrompt(text, tableRows.join('\n'));
            let data = await makeCompletionsRequest(prompt);


            // Send the response
            res.json(data);
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

// Function to extract all text from the document and return it as a text blob
function extractText(document) {
    // Get the text blocks
    const textBlocks = document.Blocks;

    // Extract the text from each block
    const textBlob = textBlocks.map(block => block.Text).join(' ');

    return textBlob;
}


// Reusable function to extract table rows from a document
function extractTableRows(document) {
    // Get the table
    const table = document.Blocks.find(block => block.BlockType === 'TABLE');

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

    return tableRows;
}

async function makeCompletionsRequest(prompt) {
    try {
        let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        const postData = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                "role": "user",
                "content": prompt
            }]
        });

        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + OPENAI_API_KEY,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const response = await axios.post('https://api.openai.com/v1/chat/completions', postData, options);
        const data = response.data;

        console.log(data);

        console.log(data);

        const firstMessageContent = data.choices[0].message.content;
        console.log(firstMessageContent);

         // return data; // Returns the raw OpenAI response
         return JSON.parse(firstMessageContent);

    } catch (error) {
        console.error(error);
    }
}

// Function to create a prompt for extracting information from a treatment plan
// This function takes in the full text and table of a treatment plan and creates a prompt
function createPrompt(fullText, table) {

    let template = `
    Return the user name, dental office, and the 4-digit dental codes with descriptions and insurance fees in this text from a treatment plan:

    Full Text:
    
    “{{ text }}”
    
    Treatment Plan Table:
    
    “{{ table }}”
    
    Use this as a template and only include words from the provided text:
    
    {
    "patient": "test name",
    "dental_office": "test office",
    "service_summary": "test summary",
    "cdt_codes": [
    {
    "code": "D1110",
    "description": "Cleaning - adult",
     "full_fee": "100.00",
    "plan_fee": "80"
    },
    {
    "code": "D1206",
    "description": "Topical fluoride varnish",
    "full_fee": "100.00",
    "plan_fee": "80"
    },
    {
    "code": "D1351",
    "description": "Sealant - per tooth",
    "full_fee": "100.00",
    "plan_fee": "80"
    }
    ]
    }
`.replace('{{ text }}', fullText).replace('{{ table }}', table);

    return template;
}



// Export the functions
module.exports = {
    getTestResponse,
    upload
};