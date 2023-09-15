const { PDFDocument } = require('pdf-lib');
const { extractTableRows, extractText, extractTextFromImage } = require('./text-extract');

/**
 * Get all the tables from a PDF file
 * Each page is sent to Textract individually
 * @param {PDFDocument} pdfDoc The PDF document
 */
async function getAllTables(pdfDoc) {
    let allTables = new Map();

    const numberOfPages = pdfDoc.getPages().length;

    for (let i = 0; i < numberOfPages; i++) {

        // Create a new "sub" document
        const subDocument = await PDFDocument.create();
        // copy the page at current index
        const [copiedPage] = await subDocument.copyPages(pdfDoc, [i])
        subDocument.addPage(copiedPage);
        const pdfBytes = await subDocument.save()

        // Get the table rows
        const tableMap = await getTablesFromBytes(pdfBytes);

        console.log('Table Map:', tableMap);
        // Merge the tables
        allTables = new Map([...allTables, ...tableMap]);

    }

    return allTables;
}

/**
 * Get tables from image or PDF bytes
 * @param {Uint8Array} bytes 
 * @returns Map of map of table rows
 */
async function getTablesFromBytes(bytes) {
    const document = await extractTextFromImage(bytes); // img.buffer

    if (document == null) {
        throw new Error('An error occurred while processing the image (Textract)');
    }

    if (document?.$response.error) {
        console.log('Error: ' + document?.$response.error);
        throw new Error('An error occurred while processing the image (Textract)');
    }

    console.log('Data: ' + document?.$response.data);

    // Get the table rows
    const tableMap = extractTableRows(document);

    console.log('Table Map:', tableMap);

    return tableMap;
}

/**
 * Get text from image or PDF bytes
 * @param {Uint8Array} bytes 
 * @returns Map of map of table rows
 */
async function getTextFromBytes(bytes) {
    const document = await extractTextFromImage(bytes); // img.buffer

    if (document == null) {
        throw new Error('An error occurred while processing the image (Textract)');
    }

    if (document?.$response.error) {
        console.log('Error: ' + document?.$response.error);
        throw new Error('An error occurred while processing the image (Textract)');
    }

    console.log('Data: ' + document?.$response.data);

    // Get the table rows
    const text = extractText(document);

    console.log('Plan Text:', text);

    return text;
}

/**
 * Get all the text from a PDF file (excluding tables)
 * Each page is sent to Textract individually
 * Note that this may lead to some text being duplicated
 * 
 * @param {PDFDocument} pdfDoc The PDF document
 */
async function getAllText(pdfDoc) {
    const numberOfPages = pdfDoc.getPages().length;

    console.log('Number of Pages:', numberOfPages);

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
            throw new Error('An error occurred while processing the image (Textract)');
        }

        if (document?.$response.error) {
            console.log('Error: ' + document?.$response.error);
            throw new Error('An error occurred while processing the image (Textract)');
        }

        console.log('Data: ' + document?.$response.data);

        // Get all text
        const text = extractText(document);

        console.log('Text:', text);

        allText = text;
    }

    return allText;
}

module.exports = {
    getAllTables, 
    getAllText,
    getTablesFromBytes,
    getTextFromBytes
};