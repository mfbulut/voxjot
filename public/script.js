const recordButton = document.getElementById("recordButton");
const playButton = document.getElementById("playButton");
const saveButton = document.getElementById("saveButton");
const transcriptionDiv = document.getElementById("transcription");
const audioPlayback = document.getElementById("audioPlayback");

let mediaRecorder;
let recordedChunks = [];
let recognition;

let isRecording = false;

recordButton.addEventListener("click", toggleRecording);
playButton.addEventListener("click", playRecording);
saveButton.addEventListener("click", saveRecording);

function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      playButton.disabled = true;
      saveButton.disabled = true;
      transcriptionDiv.disabled = true;
      app.classList = "container recording";

      recognition = new webkitSpeechRecognition() || new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const oldText = transcriptionDiv.value;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        transcriptionDiv.value = (oldText ? oldText + " " : "") + transcript;
        auto_grow(transcriptionDiv);
        transcriptionDiv.style.display = "block";
      };

      recognition.start();

      mediaRecorder.addEventListener("dataavailable", (event) => {
        recordedChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(recordedChunks, {
          type: "audio/ogg; codecs=opus",
        });
        const audioURL = URL.createObjectURL(blob);
        audioPlayback.src = audioURL;
        playButton.disabled = false;
        saveButton.disabled = false;
        transcriptionDiv.disabled = false;
        app.classList = "container stop";
        recognition.stop();
      });

      isRecording = true;
    })
    .catch((err) => {
      console.error("Error accessing microphone:", err);
    });
}

function stopRecording() {
  mediaRecorder.stop();
  isRecording = false;
}

function playRecording() {
  if (audioPlayback.paused) audioPlayback.play();
  else audioPlayback.pause();
}

async function saveRecording() {
  const newNote = {
    content: transcriptionDiv.value,
    editedAt: new Date().getTime(),
    audio: recordedChunks,
  };

  noteID = await db.new(newNote);
  playButton.disabled = true;
  saveButton.disabled = true;
  recordedChunks = [];
  transcriptionDiv.value = "";
  transcriptionDiv.style.display = "none";
  newNote.id = noteID;
  showNote(newNote)
}

function auto_grow(element) {
  element.style.height = "5px";
  element.style.height = Math.min(element.scrollHeight, 300) + "px";
}
