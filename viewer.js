const DOM = {
  list: document.getElementById("todo-list"),
  clock: document.getElementById("liveClock")
};
console.log("loadJson gestartet");
const CONFIG = {
  jsonUrl: "todo.json",
  weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
};

document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadJson();
  DOM.list.addEventListener("dragover", handleDragOver);
  DOM.list.addEventListener("dragend", handleDragEnd);
});

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

async function loadJson() {
  try {
    const response = await fetch(CONFIG.jsonUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tasks = await response.json();
    if (!Array.isArray(tasks)) throw new Error("Ungültiges Format");

    DOM.list.innerHTML = "";
    tasks.forEach(({ id, text, done }) => {
      const li = createSimpleItem(id, text, done);
      DOM.list.appendChild(li);
    });

  } catch (err) {
    DOM.list.innerHTML = `<li>Fehler beim Laden der Daten: ${err.message}</li>`;
    console.error("Fehler beim Laden der JSON:", err);
  }
}

function createSimpleItem(id, text, done) {
  const li = document.createElement("li");
  li.textContent = text;
  li.className = done ? "done" : "";
  li.draggable = true;
  li.dataset.id = id;
  li.addEventListener("dragstart", () => li.classList.add("dragging"));
  li.addEventListener("dragend", () => li.classList.remove("dragging"));
  return li;
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

function handleDragEnd() {
  const sortedIds = getSortedIds(DOM.list);
  saveSortOrder(sortedIds);
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

function getSortedIds(container) {
  return [...container.querySelectorAll("li")].map(li => li.dataset.id);
}

function saveSortOrder(idArray) {
  fetch("todo.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sort: idArray })
  }).catch(err => console.error("Fehler beim Speichern der Sortierung:", err));
}
