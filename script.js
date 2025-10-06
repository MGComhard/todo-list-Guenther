
const pageType = document.body.getAttribute("pageID");

const DOM = {
  form: document.getElementById("todo-form"),
  input: document.getElementById("todo-input"),
  list: document.getElementById("todo-list"),
  clock: document.getElementById("liveClock")
};

const CONFIG = {
  apiUrl: "todo.php",
  jsonUrl: "todo.json",
  weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
};

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 1000);
  loadTasks();
  initializeDragAndDrop();
});

function setupEventListeners() {
  if (DOM.form) {
    DOM.form.addEventListener("submit", handleFormSubmit);
  }
}

function initializeDragAndDrop() {
  if (DOM.list) {
    DOM.list.addEventListener("dragover", handleDragOver);
    DOM.list.addEventListener("dragend", handleDragEnd);
  }
}

async function loadTasks() {
  try {
    const response = await fetch(CONFIG.jsonUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tasks = await response.json();

    if (Array.isArray(tasks)) {
      DOM.list.innerHTML = "";
      tasks.forEach(({ id, text, done }) => {
        const li = createTodoItem(id, text, done);
        DOM.list.appendChild(li);
      });
    } else {
      console.warn("Unerwartetes Format:", tasks);
    }
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  const task = DOM.input.value.trim();
  if (!task) {
    showAlert("Bitte gib ein To-Do ein!");
    return;
  }
  const id = Date.now().toString();
  const li = createTodoItem(id, task, false);
  DOM.list.appendChild(li);
  DOM.input.value = "";
  saveNewTask(id, task);
}

function createTodoItem(id, text, done) {
  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.id = id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = done;
  checkbox.onchange = () => updateTaskStatus(id, checkbox.checked, li);

  const label = document.createElement("label");
  label.textContent = text;

  li.append(checkbox, label);

  if (pageType === "start") {
    const removeBtn = createDeleteButton(id, li);
    const editBtn = createEditButton(id, label);
    li.append(removeBtn, editBtn);
  }

  li.classList.toggle("done", done);
  li.addEventListener("dragstart", () => li.classList.add("dragging"));
  li.addEventListener("dragend", () => li.classList.remove("dragging"));

  return li;
}

function updateTaskStatus(id, done, li) {
  li.classList.toggle("done", done);
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, done, update: true })
  }).catch(err => console.error("Fehler beim Aktualisieren:", err));
}

function deleteTask(id, li) {
  li.remove();
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, delete: true })
  }).catch(err => console.error("Fehler beim Löschen:", err));
}

function createButton(id, label, className, title, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = className;
  btn.title = title;
  btn.onclick = onClick;
  return btn;
}

function createDeleteButton(id, li) {
  return createButton(id, "🗑️", "remove-btn", "Löschen", () => deleteTask(id, li));
}

function createEditButton(id, label) {
  return createButton(id, "✏️", "edit-btn", "Bearbeiten", () => editTask(id, label));
}

function editTask(id, label) {
  const modal = document.getElementById("editModal");
  const input = document.getElementById("editInput");
  const saveBtn = document.getElementById("editSave");
  const cancelBtn = document.getElementById("editCancel");

  input.value = label.textContent;
  modal.classList.remove("hidden");

  function closeModal() {
    modal.classList.add("hidden");
    saveBtn.removeEventListener("click", onSave);
    cancelBtn.removeEventListener("click", closeModal);
  }

  function onSave() {
    const newText = input.value.trim();
    if (newText) {
      label.textContent = newText;
      fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, task: newText, update: true })
      }).catch(err => console.error("Fehler beim Aktualisieren des Textes:", err));
    }
    closeModal();
  }
  saveBtn.addEventListener("click", onSave);
  cancelBtn.addEventListener("click", closeModal);
}

function saveNewTask(id, text) {
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, task: text, done: false })
  }).catch(err => console.error("Fehler beim Speichern:", err));
}

function handleDragOver(e) {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(DOM.list, e.clientY);
  if (afterElement == null) {
    DOM.list.appendChild(dragging);
  } else {
    DOM.list.insertBefore(dragging, afterElement);
  }
}

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll("li:not(.dragging)")];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset
      ? { offset, element: child }
      : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDragEnd() {
  const sortedIds = getSortedIds(DOM.list);
  saveSortItems(sortedIds);
}

function getSortedIds(container) {
  return [...container.querySelectorAll("li")].map(li => li.dataset.id);
}

// neue Reihenfolge der Todos speichern
function saveSortItems(idArray) {
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sort: idArray })
  }).catch(err => console.error("Fehler beim Speichern der Sortierung:", err));
}

function showAlert(alert_text) {
  const box = document.getElementById("message");
  box.textContent = alert_text;
  box.style.display = "block";
  setTimeout(() => box.style.display = "none", 3000);
}

function updateClock() {
  const now = new Date();
  const formatted =
  CONFIG.weekdays[now.getDay()] + ". " +
  String(now.getDate()).padStart(2, '0') + "." +
  String(now.getMonth() + 1).padStart(2, '0') + "." +
  now.getFullYear() + ", " +
  String(now.getHours()).padStart(2, '0') + ":" +
  String(now.getMinutes()).padStart(2, '0') + ":" +
  String(now.getSeconds()).padStart(2, '0');
  DOM.clock.textContent = formatted;
}
