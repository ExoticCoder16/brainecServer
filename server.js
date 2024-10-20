import express from 'express';
import multer from 'multer';
import bodyParser from 'body-parser';
import cors from 'cors';
import imageController from './api/imageController.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    next();
});

app.post('/api/analyze', upload.array('files', 10), async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        console.log("Received files:", req.files);
        
        const files = req.files;
        const model = req.body.model;
        console.log("Extracted files:", files);
        console.log("Extracted model:", model);

        const results = await imageController.processImages(files, model);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error processing images:', error);
        res.status(500).json({ error: error.message || 'An error occurred while processing the images' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});