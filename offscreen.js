let mediaRecorder = null;
let recordedChunks = [];
let audioContext = null;
let source = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.target !== "offscreen") return;

  if (message.type === "start-recording") {
    startRecording(message.data.streamId);
  }

  if (message.type === "stop-recording") {
    stopRecording();
  }
});

async function startRecording(streamId) {
  try {
    console.log(
      "Starting recording in offscreen document with stream ID:",
      streamId
    );

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    recordedChunks = [];

    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination);

    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      const blobUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = "recording.webm";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      chrome.runtime.sendMessage({
        source: "offscreen",
        type: "recording-complete",
        data: { blobUrl },
      });

      cleanUp(stream);
    };

    mediaRecorder.start(1000);
    console.log("Recording started in offscreen document");
  } catch (error) {
    console.error("Error starting recording in offscreen document:", error);

    chrome.runtime.sendMessage({
      source: "offscreen",
      type: "recording-error",
      error: error.message || "Unknown error",
    });
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    console.log("Stopping recording in offscreen document");
    mediaRecorder.stop();
  } else {
    console.log("No active recording to stop");
  }
}

function cleanUp(stream) {
  if (audioContext) {
    source.disconnect();
    audioContext.close();
    audioContext = null;
    source = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

console.log("Offscreen document loaded and ready");
