const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const { processAndTranscribeAudio,summarizetext } = require("./audioProcessor"); // Import function

dotenv.config();
const app = express();


const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(cors());


app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const inputFilePath = req.file.path; 
    const outputFilePath = path.join("uploads", `${req.file.filename}_compressed.mp3`);

    console.log(`Received audio file: ${inputFilePath}`);

    
    const transcriptionResult = await processAndTranscribeAudio(inputFilePath);
    
    const summary = await summarizetext(transcriptionResult.text);
   
    
   console.log(transcriptionResult)
    
    
    
    res.json({ summary: summary });
  } catch (error) {
    console.error("Error processing transcription:", error);
    res.status(500).json({ error: "Failed to process transcription" });
  }
});


app.listen(5000, () => console.log("Server running on port 5000"));
