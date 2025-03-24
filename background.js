// background.js
let recordingTabId = null;

// Create or get offscreen document
async function setupOffscreenDocument() {
  // Check if we have an offscreen document already
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  
  if (existingContexts.length > 0) {
    return;
  }
  
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Recording audio from a tab requires access to media APIs'
  });
}

// Handle messages from popup and offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRecording") {
    handleStartRecording(sendResponse);
    return true; // Keep sendResponse function valid after function returns
  }
  
  if (message.action === "stopRecording") {
    handleStopRecording(sendResponse);
    return true;
  }
  
  // Handle messages from offscreen document
  if (message.source === "offscreen" && message.type === "recording-complete") {
    handleRecordingComplete(message.data);
  }
});

async function handleStartRecording(sendResponse) {
  try {
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      sendResponse({ success: false, error: "No active tab found" });
      return;
    }
    
    const activeTabId = tabs[0].id;
    recordingTabId = activeTabId;
    
    // Setup offscreen document if needed
    await setupOffscreenDocument();
    
    // Get media stream ID
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: activeTabId });
    
    // Send stream ID to offscreen document
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: "start-recording",
      data: { streamId }
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error starting recording:", error);
    sendResponse({ success: false, error: error.message || "Unknown error" });
  }
}

function handleStopRecording(sendResponse) {
  chrome.runtime.sendMessage({
    target: "offscreen",
    type: "stop-recording"
  });
  
  sendResponse({ success: true });
}

function handleRecordingComplete(data) {
  // Fetch the recorded WebM file as a Blob
  fetch(data.blobUrl)
    .then(response => response.blob())
    .then(blob => {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      console.log("Uploading WebM file to server...");

      return fetch("http://localhost:5000/transcribe", {
        method: "POST",
        body: formData,
      });
    })
    .then(response => response.json())
    .then(data => {
      console.log("Transcription Response:", data);
    })
    .catch(error => {
      console.error("Error uploading file:", error);
    });

  // Close offscreen document when done
  chrome.offscreen.closeDocument();
}
