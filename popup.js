
document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');
  
  startBtn.addEventListener('click', function() {
    statusDiv.textContent = "Starting...";
    
    chrome.runtime.sendMessage({action: "startRecording"}, function(response) {
      if (response && response.success) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusDiv.textContent = "Recording in progress...";
      } else {
        statusDiv.textContent = "Failed to start recording: " + 
                               (response && response.error ? response.error : "Unknown error");
      }
    });
  });
  
  stopBtn.addEventListener('click', function() {
    statusDiv.textContent = "Stopping...";
    
    chrome.runtime.sendMessage({action: "stopRecording"}, function(response) {
      if (response && response.success) {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusDiv.textContent = "Recording complete! Saving file...";
      } else {
        statusDiv.textContent = "Failed to stop recording: " + 
                               (response && response.error ? response.error : "Unknown error");
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });
  });
});
