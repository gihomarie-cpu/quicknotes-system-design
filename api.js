const API_URL = "https://jsonplaceholder.typicode.com/posts";
const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusElement = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
let notes = [];

function showStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

// Shared helper for GET, POST and DELETE; throws when the server returns a non-2xx status.
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch { /* The error response may not contain JSON. */ }
    throw new Error(message);
  }
  let data = null;
  if (response.status !== 204 && (response.headers.get("content-type") || "").includes("application/json")) {
    data = await response.json();
  }
  return { data, status: response.status };
}

function renderNotes() {
  notesList.replaceChildren();
  if (notes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No notes to display. Load notes or create one.";
    notesList.appendChild(empty);
    return;
  }
  notes.forEach(note => {
    const item = document.createElement("li");
    item.className = "note-card";
    const title = document.createElement("h3");
    title.textContent = note.title || "(Untitled note)";
    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";
    const meta = document.createElement("small");
    meta.textContent = `Note ID: ${note.id}`;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "danger";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteNote(note.id, del));
    item.append(title, body, meta, del);
    notesList.appendChild(item);
  });
}

async function loadNotes() {
  loadButton.disabled = true;
  showStatus("Loading notes...", "info");
  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = Array.isArray(result.data) ? result.data : [];
    renderNotes();
    showStatus(notes.length ? `Loaded ${notes.length} notes from the server.` : "The server returned no notes.", notes.length ? "success" : "info");
  } catch (error) {
    showStatus(`Could not load notes. ${error.message}`, "error");
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title) { showStatus("Please enter a title.", "error"); titleInput.focus(); return; }
  if (title.length > 100) { showStatus("The title must be 100 characters or fewer.", "error"); titleInput.focus(); return; }
  submitButton.disabled = true;
  showStatus("Creating note...", "info");
  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 })
    });
    const created = result.data || {};
    // JSONPlaceholder simulates POST and does not persist new notes. Keep this one in page memory only.
    const localNote = { id: created.id ?? `local-${Date.now()}`, title: created.title ?? title, body: created.body ?? body, userId: created.userId ?? 1 };
    notes.unshift(localNote);
    renderNotes();
    noteForm.reset();
    showStatus(`Note created (status ${result.status}, id ${created.id ?? localNote.id}).`, "success");
  } catch (error) {
    showStatus(`Could not create note. ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id, button) {
  button.disabled = true;
  showStatus("Deleting note...", "info");
  try {
    const result = await request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
    // JSONPlaceholder simulates DELETE; removing the note updates only this browser page.
    notes = notes.filter(note => String(note.id) !== String(id));
    renderNotes();
    showStatus(`Note deleted (status ${result.status}). This change is local to this demo.`, "success");
  } catch (error) {
    showStatus(`Could not delete note. ${error.message}`, "error");
    button.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
