Chrome Extension: Voice Recorder & Summarizer
Overview
This Chrome extension allows users to record audio by simply typing "start recording" in the browser. The recorded WebM audio can be:

Converted to MP3 using FFmpeg

Transcribed using OpenAI's Whisper

Summarized using Google's Gemini AI

Downloaded in WebM format

Features
Voice Recording: Starts recording when "start recording" is typed.

WebM to MP3 Conversion: Uses FFmpeg for format conversion.

AI Transcription: Utilizes OpenAI's Whisper for speech-to-text conversion.

AI Summarization: Summarizes transcriptions using Google's Gemini AI.

Download WebM: Allows users to download the original WebM file.

Installation
Clone or download the repository.

Open Chrome and navigate to chrome://extensions/.

Enable Developer Mode in the top right corner.

Click Load unpacked and select the extension folder.

The extension is now installed.

Usage
Open a browser window and type "start recording".

The extension records your voice.

Recording stops when you type "stop recording".

The recorded WebM file is converted to MP3 using FFmpeg.

The MP3 audio is transcribed via OpenAI's Whisper.

The transcribed text is summarized using Gemini AI.

You can download the original WebM file if needed.

Technologies Used
Chrome Extension APIs for voice recording and browser interaction

FFmpeg.js for WebM to MP3 conversion

OpenAI Whisper for speech-to-text conversion

Google Gemini AI for text summarization
