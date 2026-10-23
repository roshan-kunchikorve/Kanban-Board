const STATUSES = ["todo", "doing", "done"];
const KEY = "taskboard-v1";

const seed = [
  { id: 1, title: "Design the login page", priority: "high", status: "todo" },
  { id: 2, title: "Set up the database", priority: "medium", status: "doing" },
  { id: 3, title: "Create the GitHub repo", priority: "low", status: "done" },
];

let tasks = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || seed;
  } catch {
    return seed;
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    /* storage unavailable: the board still works for this session */
  }
}

function render() {
  document.querySelectorAll(".column").forEach((col) => {
    const items = tasks.filter((t) => t.status === col.dataset.status);
    col.querySelector(".count").textContent = items.length;
    col.querySelector(".list").replaceChildren(...items.map(card));
  });
  save();
}

function button(text, label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.title = label;
  b.setAttribute("aria-label", label);
  b.addEventListener("click", onClick);
  return b;
}

function card(t) {
  const li = document.createElement("li");
  li.className = `card ${t.priority} ${t.status}`;
  li.draggable = true;

  const title = document.createElement("p");
  title.textContent = t.title; // textContent keeps user input safe from HTML injection
  title.title = "Double-click to edit";
  title.addEventListener("dblclick", () => {
    const name = prompt("Edit task", t.title);
    if (name && name.trim()) {
      t.title = name.trim();
      render();
    }
  });

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = t.priority[0].toUpperCase() + t.priority.slice(1);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.append(
    tag,
    button("\u2039", "Move left", () => shift(t, -1)),
    button("\u203A", "Move right", () => shift(t, 1)),
    button("\u2715", "Delete task", () => remove(t)),
  );

  li.append(title, meta);

  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", String(t.id));
    requestAnimationFrame(() => li.classList.add("dragging"));
  });
  li.addEventListener("dragend", () => li.classList.remove("dragging"));
  return li;
}

function move(t, status) {
  if (t.status === status) return;
  tasks = tasks.filter((x) => x !== t);
  t.status = status;
  tasks.push(t);
  render();
}

function shift(t, step) {
  const next = STATUSES[STATUSES.indexOf(t.status) + step];
  if (next) move(t, next);
}

function remove(t) {
  tasks = tasks.filter((x) => x !== t);
  render();
}

// Drag and drop targets
document.querySelectorAll(".column").forEach((col) => {
  const list = col.querySelector(".list");
  col.addEventListener("dragover", (e) => {
    e.preventDefault();
    list.classList.add("over");
  });
  col.addEventListener("dragleave", (e) => {
    if (!col.contains(e.relatedTarget)) list.classList.remove("over");
  });
  col.addEventListener("drop", (e) => {
    e.preventDefault();
    list.classList.remove("over");
    const id = e.dataTransfer.getData("text/plain");
    const t = tasks.find((x) => String(x.id) === id);
    if (t) move(t, col.dataset.status);
  });
});

// Add a new task
document.getElementById("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("title");
  const title = input.value.trim();
  if (!title) return;
  tasks.push({
    id: Date.now(),
    title,
    priority: document.getElementById("priority").value,
    status: "todo",
  });
  e.target.reset();
  input.focus();
  render();
});

render();
