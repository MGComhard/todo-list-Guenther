document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");

  try {
    const response = await fetch("todo.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tasks = await response.json();

    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        const li = createTodoItem(task.text, task.done);
        list.appendChild(li);
      });
    } else {
      console.warn("Unerwartetes Format in todo.json:", tasks);
    }
  } catch (err) {
    console.error("Fehler beim Laden der To-Dos:", err);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = input.value.trim();
    if (!task) return;

    const li = createTodoItem(task, false);
    list.appendChild(li);
    input.value = "";

    try {
      await fetch("todo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, done: false })
      });
    } catch (err) {
      console.error("Fehler beim Speichern der neuen Aufgabe:", err);
    }
  });

  function createTodoItem(text, done) {
    const li = document.createElement("li");
    li.draggable = true;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = done;
    checkbox.onchange = async () => {
      li.classList.toggle("done", checkbox.checked);
      try {
        await fetch("todo.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: text, done: checkbox.checked, update: true })
        });
      } catch (err) {
        console.error("Fehler beim Aktualisieren der Aufgabe:", err);
      }
    };

    const label = document.createElement("label");
    label.textContent = text;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = async () => {
      li.remove();
      try {
        await fetch("todo.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: text, delete: true })
        });
      } catch (err) {
        console.error("Fehler beim Löschen der Aufgabe:", err);
      }
    };

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(removeBtn);
    li.classList.toggle("done", done);

    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    return li;
  }

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(list, e.clientY);
    if (afterElement == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, afterElement);
    }
  });

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
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const formatted = `${days[now.getDay()]}. ${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    document.getElementById('liveClock').textContent = formatted;
  }
  updateClock();
  setInterval(updateClock, 1000);
});