const fs = require('fs');
const { extractTextFromImage, extractTableRows, extractText } = require('../utils/text-extract');
const { default: axios } = require('axios');
const { onRequest } = require("firebase-functions/v2/https");

// Return a test response without using Textract or OpenAI
async function getTestResponse(req, res, next) {
    try {
        // Read the contents of the test.json file
        // test-1: Dwight
        // test-2: Elishea

        const testResponse = fs.readFileSync('sample-plans/test-3.json', 'utf8');

        // Convert response to textract
        const jsonData = JSON.parse(testResponse);

        // Extract text from the image
        let document = jsonData;

        // Get the table rows
        const tableText = extractTableRows(document);

        // Get all text
        const text = extractText(document);

        console.log('Table Rows:', tableText);
        console.log('Text:', text);

        //let prompt = createPrompt(text, tableText);
        //let data = await makeCompletionsRequest(prompt);

        // Send the test response as the JSON response
         res.json(JSON.parse(testResponse));

        // Send the OpenAI response as the JSON response
        // res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing the image.');

    }
}

// Function to upload a file and extract text from it using Textract and OpenAI
async function upload(req, res, next) {
    try {

        const {
            fieldname,
            originalname,
            encoding,
            mimetype,
            buffer,
        } = req.files[0]

        console.log('fieldname:', fieldname);
        console.log('originalname:', originalname);
        console.log('encoding:', encoding);
        console.log('mimetype:', mimetype);
        console.log('buffer:', buffer);

        if (typeof req.files[0] != 'undefined') {
            // Read the file from the file system
            const image = buffer; //fs.readFileSync(req.file.path);

            // Extract text from the image
            const document = await extractTextFromImage(image);

            // Get the table rows
            const tableText = extractTableRows(document);

            // Get all text
            const text = extractText(document);

            console.log('Table Rows:', tableText);
            console.log('Text:', text);

            let prompt = createPrompt(text, tableText);
            let data = await makeCompletionsRequest(prompt);


            // Send the response with {'Access-Control-Allow-Origin': '*'} to allow CORS
            res.set('Access-Control-Allow-Origin', '*');
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

// Function to extract text from an image using Textract
async function getTextractResults(req, res, next) {
    try {

        const {
            fieldname,
            originalname,
            encoding,
            mimetype,
            buffer,
        } = req.files[0]

        console.log('fieldname:', fieldname);
        console.log('originalname:', originalname);
        console.log('encoding:', encoding);
        console.log('mimetype:', mimetype);
        console.log('buffer:', buffer);

        if (typeof req.files[0] != 'undefined') {
            // Read the file from the file system
            const image = buffer; //fs.readFileSync(req.file.path);

            // Extract text from the image
            const document = await extractTextFromImage(image);

            // Get the table rows
            const tableText = extractTableRows(document);

            // Get all text
            const text = extractText(document);

            console.log('Table Rows:', tableText);
            console.log('Text:', text);

            res.json(document);
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
    getTextractResults,
    upload
};