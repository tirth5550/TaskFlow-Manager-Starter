const STORAGE_KEY = "taskflow.tasks.v1";
const starterTasks = [
  { id: "sample-1", title: "Review project requirements", description: "Go through the assignment and list the key deliverables.", dueDate: "", priority: "High", status: "In Progress" },
  { id: "sample-2", title: "Design the dashboard layout", description: "Create a clean and responsive workspace experience.", dueDate: "", priority: "Medium", status: "Pending" },
  { id: "sample-3", title: "Prepare development checklist", description: "Break the work into small, manageable steps.", dueDate: "", priority: "Low", status: "Completed" }
];
let tasks = loadTasks();
let currentView = "all";
let editingId = null;

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterTasks.map(task => ({ ...task }));
  } catch {
    return starterTasks.map(task => ({ ...task }));
  }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
function formatDate(date) {
  if (!date) return "No due date";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === "Completed").length;
  const progress = tasks.filter(task => task.status === "In Progress").length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.getElementById("totalCount").textContent = total;
  document.getElementById("progressCount").textContent = progress;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("completionRate").textContent = `${percent}%`;
  document.getElementById("ringPercent").textContent = `${percent}%`;
  document.getElementById("ringCount").textContent = `${completed} / ${total}`;
  document.getElementById("progressBar").style.width = `${percent}%`;
  document.getElementById("progressRing").style.background = `conic-gradient(var(--purple) ${percent}%, #eeedf4 ${percent}%)`;
}
function getVisibleTasks() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const priority = document.getElementById("priorityFilter").value;
  const status = document.getElementById("statusFilter").value;
  return tasks.filter(task => {
    const matchesView = currentView === "all" || (currentView === "today" && task.dueDate === new Date().toISOString().slice(0,10)) || (currentView === "upcoming" && task.dueDate && task.dueDate > new Date().toISOString().slice(0,10) && task.status !== "Completed") || (currentView === "completed" && task.status === "Completed");
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(query);
    return matchesView && matchesSearch && (priority === "all" || task.priority === priority) && (status === "all" || task.status === status);
  });
}
function renderTasks() {
  const visible = getVisibleTasks();
  const list = document.getElementById("taskList");
  document.getElementById("visibleCount").textContent = `${visible.length} task${visible.length === 1 ? "" : "s"}`;
  document.getElementById("emptyState").classList.toggle("hidden", visible.length > 0);
  list.classList.toggle("hidden", visible.length === 0);
  list.innerHTML = visible.map(task => `
    <article class="task-row" data-id="${escapeHTML(task.id)}">
      <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} completed" ${task.status === "Completed" ? "checked" : ""} data-action="complete">
      <div class="task-main">
        <div class="task-title">${escapeHTML(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ""}
        <div class="task-meta"><span class="pill ${task.priority.toLowerCase()}">${escapeHTML(task.priority)} priority</span><span class="pill status">${escapeHTML(task.status)}</span><span class="task-date">◷ ${formatDate(task.dueDate)}</span></div>
      </div>
      <div class="task-actions"><button class="icon-btn" data-action="edit" aria-label="Edit task">✎</button><button class="icon-btn" data-action="delete" aria-label="Delete task">×</button></div>
    </article>`).join("");
  updateStats();
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}
function openModal(task = null) {
  editingId = task ? task.id : null;
  document.getElementById("modalTitle").textContent = task ? "Edit task" : "Create a task";
  document.getElementById("taskTitle").value = task?.title || "";
  document.getElementById("taskDescription").value = task?.description || "";
  document.getElementById("taskDue").value = task?.dueDate || "";
  document.getElementById("taskPriority").value = task?.priority || "Medium";
  document.getElementById("taskStatus").value = task?.status || "Pending";
  document.getElementById("taskModal").classList.remove("hidden");
  document.getElementById("taskTitle").focus();
}
function closeModal() {
  document.getElementById("taskModal").classList.add("hidden");
  document.getElementById("taskForm").reset();
  editingId = null;
}
function handleSubmit(event) {
  event.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  if (!title) { showToast("Please enter a task title."); return; }
  const taskData = {
    title,
    description: document.getElementById("taskDescription").value.trim(),
    dueDate: document.getElementById("taskDue").value,
    priority: document.getElementById("taskPriority").value,
    status: document.getElementById("taskStatus").value
  };
  if (editingId) {
    tasks = tasks.map(task => task.id === editingId ? { ...task, ...taskData } : task);
    showToast("Task updated successfully.");
  } else {
    tasks.unshift({ id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`, ...taskData });
    showToast("New task created.");
  }
  saveTasks(); renderTasks(); closeModal();
}
function handleTaskAction(event) {
  const action = event.target.dataset.action;
  if (!action) return;
  const row = event.target.closest(".task-row");
  const id = row?.dataset.id;
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  if (action === "complete") task.status = event.target.checked ? "Completed" : "Pending";
  if (action === "edit") openModal(task);
  if (action === "delete") {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    tasks = tasks.filter(item => item.id !== id);
    showToast("Task deleted.");
  }
  saveTasks(); renderTasks();
}
function setView(view) {
  currentView = view;
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  const names = { all: "My tasks", today: "Due today", upcoming: "Upcoming tasks", completed: "Completed tasks" };
  document.getElementById("taskHeading").textContent = names[view] || "My tasks";
  renderTasks();
}
function init() {
  document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  document.getElementById("openTaskModal").addEventListener("click", () => openModal());
  document.getElementById("emptyAddTask").addEventListener("click", () => openModal());
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("cancelModal").addEventListener("click", closeModal);
  document.getElementById("taskModal").addEventListener("click", event => { if (event.target.id === "taskModal") closeModal(); });
  document.getElementById("taskForm").addEventListener("submit", handleSubmit);
  document.getElementById("taskList").addEventListener("click", handleTaskAction);
  document.getElementById("taskList").addEventListener("change", handleTaskAction);
  ["searchInput", "priorityFilter", "statusFilter"].forEach(id => document.getElementById(id).addEventListener("input", renderTasks));
  document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  renderTasks();
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
if (typeof module !== "undefined") module.exports = { escapeHTML, loadTasks };
