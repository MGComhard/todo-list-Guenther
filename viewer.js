document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("todo-list");

  async function loadJson() {
    try {
      const response = await fetch("todo.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const tasks = await response.json();

      if (!Array.isArray(tasks)) throw new Error("Ungültiges Format");

      list.innerHTML = "";

      tasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task.text;
        li.className = task.done ? "done" : "";
        list.appendChild(li);
      });

    } catch (err) {
      list.innerHTML = `<li>Fehler beim Laden der Daten: ${err.message}</li>`;
      console.error("Fehler beim Laden der JSON:", err);
    }
  }

  function updateClock() {
    const now = new Date();
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const formatted = `${days[now.getDay()]}. ${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    document.getElementById('liveClock').textContent = formatted;
  }

  updateClock();
  setInterval(updateClock, 1000);
  loadJson();
});
