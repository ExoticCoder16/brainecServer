import { claudeAI } from './claudeAI.js';
import { openAI } from './openAI.js';

const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
const maxFileSize = 5 * 1024 * 1024; // 5 MB

const processImages = async (files, model) => {
    console.log("Processing images with model:", model);
    console.log("Number of files:", files.length);

    const results = [];

    if (!files || files.length === 0) {
        throw new Error('No files uploaded.');
    }

    if (!model) {
        throw new Error('AI model not selected.');
    }

    // Process each file
    for (const file of files) {
        console.log(`Processing file: ${file.originalname}`);

        if (file.size > maxFileSize) {
            results.push({
                filename: file.originalname,
                status: "Failed",
                error: "File size exceeds the limit of 5 MB.",
            });
            continue;
        }

        if (!allowedFormats.includes(file.mimetype)) {
            results.push({
                filename: file.originalname,
                status: "Failed",
                error: "Invalid file type. Only JPEG, PNG, and GIF are allowed.",
            });
            continue;
        }

        // Convert the file to base64
        const base64Image = file.buffer.toString('base64');
        const mimeType = file.mimetype;

        try {
            let result;
            switch (model) {
                case 'claude-3-5-sonnet-20240620':
                    result = await claudeAI(base64Image, mimeType);
                    break;
                case 'gpt-4o':
                    result = await openAI(base64Image, mimeType);
                    break;
                default:
                    results.push({
                        filename: file.originalname,
                        status: "Failed",
                        error: "Invalid AI model selected.",
                    });
                    continue;
            }

            results.push({
                filename: file.originalname,
                status: "Success",
                analysis: result,
            });
        } catch (analysisError) {
            console.error(`Error analyzing ${file.originalname}:`, analysisError);
            results.push({
                filename: file.originalname,
                status: "Failed",
                error: "Analysis failed. Please try again.",
            });
        }
    }

    return results;
};

export default { processImages };