document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = input.value.trim();
    if (!task) return;

    const li = createTodoItem(task);
    list.appendChild(li);
    input.value = "";

    await fetch("todo.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    });
  });

  function createTodoItem(task) {
    const li = document.createElement("li");
    li.draggable = true;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.onchange = () => {
      li.classList.toggle("done", checkbox.checked);
    };

    const label = document.createElement("label");
    label.textContent = task;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => li.remove();

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(removeBtn);

    // Drag events
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
});