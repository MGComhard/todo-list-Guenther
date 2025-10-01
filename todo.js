document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");

  // 🟢 Lade gespeicherte Aufgaben
  const response = await fetch("todo.json");
  const tasks = await response.json();
  tasks.forEach(task => {
    const li = createTodoItem(task.text, task.done);
    list.appendChild(li);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = input.value.trim();
    if (!task) return;

    const li = createTodoItem(task, false);
    list.appendChild(li);
    input.value = "";

    await fetch("todo.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, done: false })
    });
  });

  function createTodoItem(text, done) {
    const li = document.createElement("li");
    li.draggable = true;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = done;
    checkbox.onchange = async () => {
      li.classList.toggle("done", checkbox.checked);
      await fetch("todo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: text, done: checkbox.checked, update: true })
      });
    };

    const label = document.createElement("label");
    label.textContent = text;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => {
      li.remove();
      fetch("todo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: text, delete: true })
      });
    };

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(removeBtn);
    li.classList.toggle("done", done);

    // Drag events bleiben wie gehabt
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    return li;
  }

  // Drag & Drop bleibt unverändert
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
});

  function updateClock() {
    const now = new Date();
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const dayOfWeek = days[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formatted = `${dayOfWeek}. ${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
    document.getElementById('liveClock').textContent = formatted;
  }
  updateClock();
  setInterval(updateClock, 1000);
