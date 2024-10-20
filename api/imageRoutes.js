import express from "express";
import multer from "multer";
import { processImages } from "./imageController.js"; // Import the processImages function

const router = express.Router();

// Setup multer to handle file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

// Endpoint to analyze uploaded images
router.post("/analyze", upload.array('files', 10), processImages); // Use multer directly to handle file uploads

export default router;
