class NotesDB {
  constructor() {
    this.dbName = "notesDB";
    this.storeName = "notesStore";
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        reject("Error opening IndexedDB database");
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve("IndexedDB database opened successfully");
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(this.storeName, {
          keyPath: "id",
          autoIncrement: true,
        });
      };
    });
  }

  async new(note) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.add(note);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject("Error adding new note to IndexedDB");
      };
    });
  }

  async update(noteID, newNote) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.put({ id: noteID, ...newNote });

      request.onsuccess = () => {
        resolve("Note updated successfully");
      };

      request.onerror = (event) => {
        reject("Error updating note in IndexedDB");
      };
    });
  }

  async delete(noteID) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.delete(noteID);

      request.onsuccess = () => {
        resolve("Note deleted successfully");
      };

      request.onerror = (event) => {
        reject("Error deleting note from IndexedDB");
      };
    });
  }

  async getAllNotes() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject("Error getting all notes from IndexedDB");
      };
    });
  }

  async getNoteById(noteID) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(noteID);

      request.onsuccess = (event) => {
        const note = event.target.result;
        if (note) {
          resolve(note);
        } else {
          reject("Note not found");
        }
      };

      request.onerror = (event) => {
        reject("Error getting note from IndexedDB");
      };
    });
  }
}

const db = new NotesDB();
const notesContainer = document.getElementById("notes");

function createNoteElement(note) {
  const noteElement = document.createElement("div");
  noteElement.classList.add("note");
  noteElement.innerText = note.content;
  return noteElement;
}

db.init().then(async () => {
  const allNotes = await db.getAllNotes();
  allNotes.forEach((note) => {
    showNote(note);
  });
});

async function playNote(noteID) {
  const player = document
    .getElementById("note-" + noteID)
    .querySelector("audio");

  if (player.paused) player.play();
  else player.pause();
}

function deleteNote(noteID) {
  if (confirm("Are you sure you want to delete this note?")) {
    db.delete(noteID);
    document.getElementById("note-" + noteID).remove();
  }
}
async function editNote(noteID, editButton) {
  const myTextArea = document
    .getElementById("note-" + noteID)
    .querySelector("textarea");

  if (myTextArea.disabled) {
    myTextArea.disabled = false;
    editButton.classList = "editing";
  } else {
    let note = await db.getNoteById(noteID);
    if (confirm("Are you sure you want to save changes?")) {
      note.content = myTextArea.value;
      db.update(noteID, note);
    } else {
      myTextArea.value = note.content;
    }
    myTextArea.disabled = true;
    editButton.classList = "";
  }
}

async function aiSummary(noteID) {
  const note = await db.getNoteById(noteID);
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: note.content }),
  };
  const response = await fetch("/api/query", options);
  const data = await response.text();
  if(!data){
    alert("There is some issue with ai server try again later")
    return;
  }
  console.log(data);
  aiText.innerText = data;
  dialog.showModal();
}

function showNote(note) {
  const container = document.getElementById("notes");
  const newElement = document.createElement("div");
  newElement.classList = "note";
  newElement.id = "note-" + note.id;
  container.appendChild(newElement);
  newElement.innerHTML = `
<div class="note-content">
  <button onclick="playNote(${note.id})">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="60"
          height="60">
          <path fill-rule="evenodd"
              d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
              clip-rule="evenodd" />
      </svg>
  </button>
  <textarea disabled cols="42" rows="3" oninput="auto_grow(this)"></textarea>
</div>
<div class="note-controls">
  <div>
      <span class="timeBar">0:00 / 0:00</span>
      <progress value="0"></progress>
  </div>
  <div>
      <button onclick="aiSummary(${note.id})">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path fill-rule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clip-rule="evenodd" />
      </svg>

        AI Summary
      </button>
      <button onclick="deleteNote(${note.id})">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"clip-rule="evenodd" />
          </svg>
      </button>
      <button onclick="editNote(${note.id}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24"height="24">
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
              <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
          </svg>
      </button>
  </div>
  <audio controls style="display: none"></audio>
</div>`;
  newElement.querySelector("textarea").value = note.content;
  auto_grow(newElement.querySelector("textarea"))
  const blob = new Blob(note.audio, { type: "audio/ogg; codecs=opus" });
  const audioURL = URL.createObjectURL(blob);
  const player = newElement.querySelector("audio");
  player.src = audioURL;

  getBlobDuration(blob).then((duration) => {
    const totalDuration = duration || 1;
    UpdateDuration(0, totalDuration, newElement);
    player.addEventListener("timeupdate", () => {
      const currentTime = player.currentTime || 0;
      UpdateDuration(currentTime, totalDuration, newElement);
    });
    player.onended = function () {
      UpdateDuration(totalDuration, totalDuration, newElement);
    };
  });
}

function UpdateDuration(currentTime, totalDuration, newElement) {
  const currentMinutes = Math.floor(currentTime / 60) | 0;
  const currentSeconds = Math.floor(currentTime % 60) | 0;
  const totalMinutes = Math.floor(totalDuration / 60) | 0;
  const totalSeconds = Math.floor(totalDuration % 60) | 0;
  const formattedCurrentTime = `${currentMinutes}:${currentSeconds
    .toString()
    .padStart(2, "0")}`;
  const formattedTotalDuration = `${totalMinutes}:${totalSeconds
    .toString()
    .padStart(2, "0")}`;
  newElement.querySelector("progress").value = currentTime / totalDuration;
  newElement.querySelector(".timeBar").innerText =
    formattedCurrentTime + " / " + formattedTotalDuration;
}

async function getBlobDuration(blob) {
  const tempVideoEl = document.createElement("video");

  const durationP = new Promise((resolve, reject) => {
    tempVideoEl.addEventListener("loadedmetadata", () => {
      // Chrome bug: https://bugs.chromium.org/p/chromium/issues/detail?id=642012
      if (tempVideoEl.duration === Infinity) {
        tempVideoEl.currentTime = Number.MAX_SAFE_INTEGER;
        tempVideoEl.ontimeupdate = () => {
          tempVideoEl.ontimeupdate = null;
          resolve(tempVideoEl.duration);
          tempVideoEl.currentTime = 0;
        };
      }
      // Normal behavior
      else resolve(tempVideoEl.duration);
    });
    tempVideoEl.onerror = (event) => reject(event.target.error);
  });

  tempVideoEl.src =
    typeof blob === "string" || blob instanceof String
      ? blob
      : window.URL.createObjectURL(blob);

  return durationP;
}
