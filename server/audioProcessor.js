const fs = require("fs");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");


async function processAndTranscribeAudio(inputFilePath, bitrate = "64k") {
  const fileDir = path.dirname(inputFilePath);
  const fileName = path.basename(inputFilePath, path.extname(inputFilePath));
  
  let mp3FilePath = inputFilePath;
  
  
  if (path.extname(inputFilePath) === ".webm") {
    mp3FilePath = path.join(fileDir, `${fileName}.mp3`);
    console.log(`Converting WebM to MP3: ${inputFilePath} → ${mp3FilePath}`);
    await convertWebMToMP3(inputFilePath, mp3FilePath);
    safeDelete(inputFilePath); 
  }

  const compressedFilePath = path.join(fileDir, `${fileName}_compressed.mp3`);

  try {
    console.log(`Compressing audio file: ${mp3FilePath}`);
    await compressAudio(mp3FilePath, compressedFilePath, bitrate);
    console.log(`Compression complete: ${compressedFilePath}`);

    console.log("Sending to Whisper API for transcription...");
    const transcription = await transcribeAudio(compressedFilePath);
    
    return transcription;
  } catch (error) {
    console.error("Error in processing pipeline:", error);
    throw error;
  } finally {
   
    safeDelete(mp3FilePath);
    safeDelete(compressedFilePath);
  }
}


function convertWebMToMP3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputFile}" -b:a 192k "${outputFile}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`FFmpeg error (WebM → MP3): ${stderr}`);
        reject(new Error("Failed to convert WebM to MP3"));
        return;
      }
      resolve();
    });
  });
}


function compressAudio(inputFile, outputFile, bitrate) {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputFile}" -b:a ${bitrate} "${outputFile}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`FFmpeg error (Compression): ${stderr}`);
        reject(new Error("Failed to compress audio file"));
        return;
      }
      resolve();
    });
  });
}


async function transcribeAudio(filePath) {
  try {
    const audioData = fs.readFileSync(filePath);

    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo",
      audioData,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`, 
          "Content-Type": "audio/mpeg"
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("API Error (Transcription):", error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Summarizes transcribed text using Google Gemini API
 * @param {string} text - The transcribed text
 * @returns {Promise<string>} - The summarized text
 */
async function summarizetext(text){
  try {
    const genAI = new GoogleGenerativeAI(process.env.G_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Summarize the following meeting discussion in a clear, structured, and concise paragraph format. Ensure that the summary captures the key discussion points, proposed solutions, decisions made, and follow-up tasks. The response should be well-organized, easy to read, and professional. Avoid unnecessary details while maintaining the core essence of the discussion. Structure the summary as follows:

Introduction: Briefly introduce the meeting's purpose and participants.

Key Discussion Points: Outline the main topics discussed.

Proposed Solutions: Highlight any suggested solutions.

Decisions Made: Summarize key decisions agreed upon.

Follow-up Actions: List next steps, assigned responsibilities, and deadlines.

Meeting Transcript: ${text}
    `;

    const result = await model.generateContent(prompt);
    
    
    const responseText = result.response.text();
    return responseText;
  } catch (error) {
    console.error("Error in summarization:", error);
    throw error;
  }
}

/**
 * Safely deletes a file if it exists
 * @param {string} filePath - Path to the file
 */
function safeDelete(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    }
  }
}

module.exports = { processAndTranscribeAudio, summarizetext };
