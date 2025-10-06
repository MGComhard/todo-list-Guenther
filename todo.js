const DOM = {
  form: document.getElementById("todo-form"),
  input: document.getElementById("todo-input"),
  list: document.getElementById("todo-list"),
  clock: document.getElementById("liveClock")
};

const CONFIG = {
  apiUrl: "todo.php",
  weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
};

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 1000);
  await loadTasks();
});

function setupEventListeners() {
  DOM.form.addEventListener("submit", handleFormSubmit);
  DOM.list.addEventListener("dragover", handleDragOver);
}

async function loadTasks() {
  try {
    const response = await fetch("todo.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tasks = await response.json();

    if (Array.isArray(tasks)) {
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

function createDeleteButton(id, li) {
  const btn = document.createElement("button");
  btn.textContent = "🗑️";
  btn.className = "remove-btn";
  btn.title = "Löschen";
  btn.onclick = () => deleteTask(id, li);
  return btn;
}

function createEditButton(id, label) {
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  editBtn.className = "edit-btn";
  editBtn.title = "Bearbeiten";
  editBtn.onclick = () => editTask(id, label);
  return editBtn;
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

  const removeBtn = createDeleteButton(id, li);
  const editBtn = createEditButton(id, label);

  li.append(checkbox, label, removeBtn, editBtn);
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
