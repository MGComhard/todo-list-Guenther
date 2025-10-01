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
      tasks.forEach(({ text, done }) => {
        const li = createTodoItem(text, done);
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
  if (!task) return;

  const li = createTodoItem(task, false);
  DOM.list.appendChild(li);
  DOM.input.value = "";
  saveNewTask(task);
}

function createTodoItem(text, done) {
  const li = document.createElement("li");
  li.draggable = true;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = done;
  checkbox.onchange = () => updateTaskStatus(text, checkbox.checked, li);

  const label = document.createElement("label");
  label.textContent = text;

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "🗑️";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => deleteTask(text, li);

  li.append(checkbox, label, removeBtn);
  li.classList.toggle("done", done);

  li.addEventListener("dragstart", () => li.classList.add("dragging"));
  li.addEventListener("dragend", () => li.classList.remove("dragging"));

  return li;
}

function updateTaskStatus(text, done, li) {
  li.classList.toggle("done", done);
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: text, done, update: true })
  }).catch(err => console.error("Fehler beim Aktualisieren:", err));
}

function deleteTask(text, li) {
  li.remove();
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: text, delete: true })
  }).catch(err => console.error("Fehler beim Löschen:", err));
}

function saveNewTask(text) {
  fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: text, done: false })
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
