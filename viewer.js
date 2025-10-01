const DOM = {
  list: document.getElementById("todo-list"),
  clock: document.getElementById("liveClock")
};

const CONFIG = {
  jsonUrl: "todo.json",
  weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
};

document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadJson();
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
    tasks.forEach(({ text, done }) => {
      const li = createSimpleItem(text, done);
      DOM.list.appendChild(li);
    });

  } catch (err) {
    DOM.list.innerHTML = `<li>Fehler beim Laden der Daten: ${err.message}</li>`;
    console.error("Fehler beim Laden der JSON:", err);
  }
}

function createSimpleItem(text, done) {
  const li = document.createElement("li");
  li.textContent = text;
  li.className = done ? "done" : "";
  return li;
}