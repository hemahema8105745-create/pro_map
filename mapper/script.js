// Show image preview
document.getElementById("imageInput").addEventListener("change", function(event){
    const img = document.getElementById("preview");
    img.src = URL.createObjectURL(event.target.files[0]);
    img.style.display = "block";
});

// Mock description generator (replace with AI API later)
document.getElementById("generateBtn").addEventListener("click", function() {
    let desc = "A concise narrated description of the uploaded image.";
    document.getElementById("descriptionBox").value = desc;
});

// Play audio (TTS)
document.getElementById("playAudioBtn").addEventListener("click", function() {
    let text = document.getElementById("descriptionBox").value;
    let speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speechSynthesis.speak(speech);
});

// Download text
document.getElementById("downloadTextBtn").addEventListener("click", function() {
    let text = document.getElementById("descriptionBox").value;
    let blob = new Blob([text], { type: "text/plain" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "description.txt";
    a.click();
});

// Download audio (needs backend)
document.getElementById("downloadAudioBtn").addEventListener("click", function() {
    alert("Downloading audio requires backend TTS API (e.g., Google, Azure, OpenAI).");
});
