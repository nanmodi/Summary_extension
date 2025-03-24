
let recordingTabId = null;


async function setupOffscreenDocument() {
 
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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRecording") {
    handleStartRecording(sendResponse);
    return true; 
  }
  
  if (message.action === "stopRecording") {
    handleStopRecording(sendResponse);
    return true;
  }
  

  if (message.source === "offscreen" && message.type === "recording-complete") {
    handleRecordingComplete(message.data);
  }
});

async function handleStartRecording(sendResponse) {
  try {
   
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      sendResponse({ success: false, error: "No active tab found" });
      return;
    }
    
    const activeTabId = tabs[0].id;
    recordingTabId = activeTabId;
    
    await setupOffscreenDocument();
    
 
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: activeTabId });
    
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

  fetch(data.blobUrl)
    .then(response => response.blob())
    .then(blob => {
     
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
