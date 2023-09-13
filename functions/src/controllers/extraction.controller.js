const fs = require('fs');
const { extractTextFromImage, extractTableRows, extractText } = require('../utils/text-extract');
const { default: axios } = require('axios');
const path = require('path');
const PDFDocument = require('pdf-lib').PDFDocument;

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

        let useGpt4 = req.query.useGpt4 == 'true';

        //let prompt = createPrompt(text, tableText, '');
        //let data = await makeCompletionsRequest(prompt, useGpt4);

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

        let useGpt4 = req.query.useGpt4 == 'true';

        if (typeof req.files[0] != 'undefined') {

            // Extract text from the image
            const document = await extractTextFromImage(buffer); // img.buffer

            if (document == null) {
                res.status(500).send('An error occurred while processing the image.');
                return;
            }

            console.log('Data: ' + document?.$response.data);
            console.log('Error: ' + document?.$response.error);

            if (document?.$response.error) {
                res.status(500).send('An error occurred while processing the image: ' + document?.$response.error?.message);
                return;
            }

            // Get the table rows
            const tableText = extractTableRows(document);

            // Get all text
            const text = extractText(document);

            console.log('Table Rows:', tableText);
            console.log('Text:', text);

            let prompt = createPrompt(text, tableText, originalname);
            let data = await makeCompletionsRequest(prompt, useGpt4);

            // Send the response with {'Access-Control-Allow-Origin': '*'} to allow CORS
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('error in upload: ' + error.message);
    } finally {
        if (typeof req.file != 'undefined') {
            // Delete the uploaded file
            fs.unlinkSync(req.file.path);
        }
    }
}

async function uploadPdf(req, res, next) {
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

        let useGpt4 = req.query.useGpt4 == 'true';

        if (typeof req.files[0] != 'undefined') {

            await fs.writeFile(originalname, buffer, function (err) { })

            const docmentAsBytes = await fs.promises.readFile(originalname);

            const pdfDoc = await PDFDocument.load(docmentAsBytes);

            console.log('PDF Document:', pdfDoc);

            const numberOfPages = pdfDoc.getPages().length;

            console.log('Number of Pages:', numberOfPages);

            let allTableText = '';
            let allText = '';

            for (let i = 0; i < numberOfPages; i++) {

                // Create a new "sub" document
                const subDocument = await PDFDocument.create();
                // copy the page at current index
                const [copiedPage] = await subDocument.copyPages(pdfDoc, [i])
                subDocument.addPage(copiedPage);
                const pdfBytes = await subDocument.save()
                const document = await extractTextFromImage(pdfBytes); // img.buffer

                if (document == null) {
                    await fs.unlink(originalname, function (err) { });
                    res.status(500).send('An error occurred while processing the image.');
                    return;
                }

                console.log('Data: ' + document?.$response.data);
                console.log('Error: ' + document?.$response.error);

                if (document?.$response.error) {
                    await fs.unlink(originalname, function (err) { });
                    res.status(500).send('An error occurred while processing the image: ' + document?.$response.error?.message);
                    return;
                }

                // Get the table rows
                const tableText = extractTableRows(document);

                // Get all text
                const text = extractText(document);

                console.log('Table Rows:', tableText);
                console.log('Text:', text);

                allTableText += tableText;

                allText += text;
            }
            // Extract text from the image

            let prompt = createPrompt(allText, allTableText, originalname);
            let data = await makeCompletionsRequest(prompt, useGpt4);

            await fs.unlink(originalname, function (err) { });
            // Send the response with {'Access-Control-Allow-Origin': '*'} to allow CORS
            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('error in upload: ' + error.message);
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

async function makeCompletionsRequest(prompt, useGpt4 = false) {
    try {
        let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        const postData = JSON.stringify({
            model: useGpt4 ? 'gpt-4' : 'gpt-3.5-turbo',
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
        // Start at the first { and end at the last }
        return JSON.parse(firstMessageContent.substring(firstMessageContent.indexOf('{'), firstMessageContent.lastIndexOf('}') + 1));

    } catch (error) {
        console.error(error);
    }
}

// Function to create a prompt for extracting information from a treatment plan
// This function takes in the full text and table of a treatment plan and creates a prompt
function createPrompt(fullText, table, fileName) {

    let template = `
    Return the user name, dental office, and the 4-digit dental codes with descriptions and insurance fees in this text from a treatment plan:

    File Name:

    “{{ fileName }}”

    Full Text:
    
    “{{ text }}”
    
    Treatment Plan Table:
    
    “{{ table }}”
    
    Use this as a template:
    
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

    Be concise.
`.replace('{{ text }}', fullText).replace('{{ table }}', table);

    return template;
}

// Export the functions
module.exports = {
    getTestResponse,
    getTextractResults,
    upload,
    uploadPdf
};

