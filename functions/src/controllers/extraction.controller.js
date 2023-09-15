const fs = require('fs');
const { extractTextFromImage, extractTableRows, extractText } = require('../utils/text-extract');
const { getAllTables, getAllText, getTablesFromBytes, getTextFromBytes } = require('../utils/prompt-maker');
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

/**
 * Get the patient and dentist names from a treatment plan
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
async function getPlanDetails(req, res, next) {
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

            try {
                await fs.writeFile(originalname, buffer, function (err) { })

                const docmentAsBytes = await fs.promises.readFile(originalname);

                let text;
                if (originalname.endsWith('.pdf')) {

                    const pdfDoc = await PDFDocument.load(docmentAsBytes);

                    text = await getAllText(pdfDoc);
                } else {
                    text = await getTextFromBytes(docmentAsBytes);
                }

                let prompt = createDetailsPrompt(text, originalname);

                let data = await makeCompletionsRequest(prompt, useGpt4);

                await fs.unlink(originalname, function (err) { });

                res.set('Access-Control-Allow-Origin', '*');
                res.json(data);
            } catch (error) {
                console.error(error);
                fs.unlink(originalname, function (err) { });
            }
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

async function getCdtCodes(req, res, next) {
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

            try {
                await fs.writeFile(originalname, buffer, function (err) { })

                const docmentAsBytes = await fs.promises.readFile(originalname);

                let tables;
                if (originalname.endsWith('.pdf')) {

                    const pdfDoc = await PDFDocument.load(docmentAsBytes);

                    tables = await getAllTables(pdfDoc);
                } else {
                    tables = await getTablesFromBytes(docmentAsBytes);
                }

                let prompt = createCodesPrompt(JSON.stringify([...tables]));

                let data = await makeCompletionsRequest(prompt, useGpt4);

                await fs.unlink(originalname, function (err) { });

                res.set('Access-Control-Allow-Origin', '*');
                res.json(data);
            } catch (error) {
                console.error(error);
                fs.unlink(originalname, function (err) { });
            }
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

        let jsonOutput;
        // get string between ``` and ```
        // const regex = /```([^`]*)```/gm;
        //const matches = regex.exec(firstMessageContent);
        // console.log(matches);

        // if(matches != undefined && matches?.length > 1) {
        //    jsonOutput = matches[1];
        //} else {
        jsonOutput = firstMessageContent.substring(firstMessageContent.indexOf('{'), firstMessageContent.lastIndexOf('}') + 1);
        //}

        // return data; // Returns the raw OpenAI response
        // Start at the first { and end at the last }
        return JSON.parse(jsonOutput);

    } catch (error) {
        console.error(error);
    }
}

/**
 * Function to create a prompt for extracting just the CDT code information from a treatment plan:
 * - CDT codes
 * - Descriptions
 * - Fees
 * - Teeth
 * - Dates
 * - Visits
 * This prompt does not include text outside of tables. Use GPT 4 for best results.
 */
function createCodesPrompt(tables) {
    let template = `
    Return a JSON object with the 4-digit dental codes with descriptions and insurance fees in this text from a treatment plan. 
    Some codes will apply to multiple teeth. Include teeth and surfaces if applicable.
    
    “{{ tables }}”
    
    Use this as a template:
    
    {
    "cdt_codes": [
    {
    "code": "D1110",
    "description": "Cleaning - adult",
     "full_fee": "100.00",
    "plan_fee": "80",
    "date": "10/10/2021",
    "visit": "1",
    "teeth": ["1DO"]
    },
    {
    "code": "D1206",
    "description": "Topical fluoride varnish",
    "full_fee": "100.00",
    "plan_fee": "80",
    "date": "10/10/2021",
    "visit": "1",
    "teeth": ["1","2"]
    },
    {
    "code": "D1351",
    "description": "Sealant - per tooth",
    "full_fee": "100.00",
    "plan_fee": "80",
    "date": "10/11/2021",
    "visit": "2",
    "teeth": ["3UR","3UL"]
    }
    ]
    }

    Do not remove duplicates. Be concise.
`.replace('{{ tables }}', tables);

    return template;
}

/**
 * Get the patient name and dental office from a treatment plan
 * GPT 3.5 should be able to handle this
 * @param {String} fullText Full text from the treatment plan excluding tables
 * @param {*} fileName Name of the file that was uploaded
 * @returns 
 */
function createDetailsPrompt(fullText, fileName) {
    let template = `
    Return the user name and dental office in this text from a treatment plan:

    File Name:

    “{{ fileName }}”

    Full Text:
    
    “{{ text }}”
    
    
    Use this as a template:
    
    {
    "patient": "test name",
    "dental_office": "test office",
    }

    Be concise.
`.replace('{{ text }}', fullText).replace('{{ fileName }}', fileName);

    return template;
}

/**
 * Function to create a prompt for extracting all relevant information from a treatment plan
 * - Patient name
 * - Dental office
 * - Service summary
 * - CDT codes
 * This function takes in the full text and table of a treatment plan and creates a prompt
 * @param {*} fullText 
 * @param {*} table 
 * @param {*} fileName 
 * @returns 
 */
function createFullPrompt(fullText, table, fileName) {

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
    "plan_fee": "80",
    "date": "10/10/2021",
    "visit": "1",
    "tooth": "1"
    },
    {
    "code": "D1206",
    "description": "Topical fluoride varnish",
    "full_fee": "100.00",
    "plan_fee": "80",
    "date": "10/10/2021",
    "visit": "1",
    "tooth": "2"
    },
    "code": "D1206",
    "description": "Topical fluoride varnish",
    "full_fee": "100.00",
    "plan_fee": "80",
    "date": "10/11/2021",
    "visit": "2",
    "tooth": "2"
    },
    {
    "code": "D1351",
    "description": "Sealant - per tooth",
    "full_fee": "100.00",
    "plan_fee": "80",
    "date": "10/11/2021",
    "visit": "2",
    "tooth": ""
    }
    ]
    }

    Be concise.
`.replace('{{ text }}', fullText).replace('{{ table }}', table).replace('{{ fileName }}', fileName);

    return template;
}

// Export the functions
module.exports = {
    getTestResponse,
    getTextractResults,
    getPlanDetails,
    getCdtCodes
};

