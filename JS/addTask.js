// Global chart instances
let completionChart, categoryChart, priorityChart;

/* =========================
   STORAGE HELPERS
========================= */
function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* =========================
   CATEGORY COLORS
========================= */
const categoryStyles = {
    Work: "bg-primary",
    Personal: "bg-success",
    Study: "bg-info",
    Health: "bg-danger",
    Finance: "bg-warning",
    Other: "bg-secondary"
};

/* =========================
   PAGE SWITCHING
========================= */
function hideAllPages() {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
}

function showPage(pageId) {
    hideAllPages();
    const page = document.getElementById(`${pageId}-page`);
    if (page) page.classList.add("active");

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("data-page") === pageId) link.classList.add("active");
    });

    // Page-specific rendering
    if (pageId === "dashboard") {
        renderRecentTasks();
        updateTaskStats();
    }
    if (pageId === "my-tasks") renderTasks();
    if (pageId === "categories") renderCategories();
    if (pageId === "analytics") renderAnalytics();
    if (pageId === "board") renderBoard();
}

/* =========================
   NAVIGATION
========================= */
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const pageName = this.getAttribute('data-page');
        showPage(pageName);
    });
});

// Quick action buttons: View All (sorted by name) and View Analytics
document.getElementById('view-all-tasks')?.addEventListener('click', function (e) {
    e.preventDefault();
    const tasks = getTasks().slice().sort((a, b) => (a.title || '').toString().localeCompare((b.title || '').toString(), undefined, { sensitivity: 'base' }));
    renderTasks(tasks);
    showPage('my-tasks');
});

document.getElementById('view-analytics')?.addEventListener('click', function (e) {
    e.preventDefault();
    showPage('analytics');
});

// Logout
document.getElementById('logout')?.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!confirm('Are you sure you want to log out?')) {
        return;
    }

    try {
        await fetch('../php/logout.php', {
            method: 'POST',
            credentials: 'same-origin'
        });
    } catch (error) {
        console.error('Logout request failed:', error);
    }

    localStorage.removeItem('currentUser');
    // Optionally keep tasks; if you want to clear tasks too, uncomment next line
    // localStorage.removeItem('tasks');
    window.location.href = "../index.html";
});

/* =========================
   ADD / UPDATE TASK
========================= */
document.getElementById("task-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("task-title").value.trim();
    if (!title) return alert("Task title is required!");

    const description = document.getElementById("task-description").value.trim();
    const category = document.getElementById("task-category").value;
    const priority = document.getElementById("task-priority").value;
    const dueDate = document.getElementById("task-due-date").value;
    const editIndex = document.getElementById("task-edit-index").value;

    const tasks = getTasks();

    if (editIndex !== "") {
        tasks[editIndex] = { ...tasks[editIndex], title, description, category, priority, dueDate };
        document.getElementById("task-edit-index").value = "";
    } else {
        tasks.push({
            title,
            description,
            category,
            priority,
            dueDate,
            status: "Pending",
            createdAt: new Date().toISOString()
        });
    }

    saveTasks(tasks);
    this.reset();
    refreshAll();
    showPage("my-tasks");
});

/* =========================
   MODAL ADD TASK (quick modal)
   ========================= */
document.getElementById("saveTask")?.addEventListener("click", function (e) {
    e.preventDefault();
    const title = document.getElementById("taskTitle").value.trim();
    if (!title) return alert("Task title is required!");

    const description = document.getElementById("taskDesc").value.trim();
    const category = document.getElementById("taskCategoryModal").value;
    const priority = document.getElementById("taskPriorityModal").value;
    const dueDate = document.getElementById("taskDue").value;

    const tasks = getTasks();
    tasks.push({
        title,
        description,
        category,
        priority,
        dueDate,
        status: "Pending",
        createdAt: new Date().toISOString()
    });

    saveTasks(tasks);

    // reset modal form
    const mf = document.getElementById('taskForm'); if (mf) mf.reset();

    // hide modal
    const modalEl = document.getElementById('addTaskModal');
    if (modalEl) {
        const modalInst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInst.hide();
    }

    refreshAll();
    showPage("my-tasks");
});

/* =========================
   TASK ACTIONS
========================= */
function deleteTask(index) {
    if (!confirm("Delete this task?")) return;
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    refreshAll();
}

function editTask(index) {
    const tasks = getTasks();
    const task = tasks[index];

    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description;
    document.getElementById("task-category").value = task.category;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-due-date").value = task.dueDate || "";
    document.getElementById("task-edit-index").value = index;

    showPage("add-task");
}

function toggleTaskStatus(index) {
    const tasks = getTasks();
    const current = tasks[index].status || "Pending";
    const next = current === "Pending" ? "In Progress" : current === "In Progress" ? "Completed" : "Pending";
    tasks[index].status = next;
    saveTasks(tasks);
    refreshAll();
}

function setTaskStatus(index, status) {
    const tasks = getTasks();
    if (!tasks[index]) return;
    tasks[index].status = status;
    saveTasks(tasks);
    refreshAll();
}

function setTaskStatusById(identifier, status) {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => (t.id || t.createdAt) === identifier);
    if (idx === -1) return;
    tasks[idx].status = status;
    saveTasks(tasks);
    refreshAll();
}

/* =========================
   RENDER FUNCTIONS
========================= */
function renderTasks(tasksList = null) {
    const tbody = document.getElementById("tasks-table-body");
    if (!tbody) return;

    const tasks = tasksList || getTasks();
    tbody.innerHTML = "";

    if (tasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No tasks yet</td></tr>`;
        return;
    }

    tasks.forEach((task, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${task.title}</td>
            <td><span class="badge ${task.status === "Completed" ? "bg-success" : task.status === "In Progress" ? "bg-info" : "bg-warning"}">${task.status}</span></td>
            <td><span class="badge ${categoryStyles[task.category] || "bg-secondary"}">${task.category}</span></td>
            <td>${task.priority}</td>
            <td>${task.dueDate || "-"}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editTask(${index})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-success" onclick="toggleTaskStatus(${index})"><i class="fas fa-check"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTask(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderRecentTasks() {
    const list = document.getElementById("recent-tasks-list");
    if (!list) return;

    const tasks = getTasks();
    list.innerHTML = "";

    if (tasks.length === 0) {
        list.innerHTML = "<p class='text-muted'>No tasks yet</p>";
        return;
    }

    // tasks.slice(-5).reverse().forEach(task => {
    //     const item = document.createElement("div");
    //     item.className = "border rounded p-2 mb-2";
    //     item.innerHTML = `
    //         <strong>${task.title}</strong><br>
    //         <small>${task.category} | ${task.priority} | ${task.dueDate || 'No due date'}</small>
    //     `;
    //     list.appendChild(item);
    // });
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item d-flex justify-content-between align-items-center border-bottom py-2';
        taskElement.innerHTML = `
                    <div>
                        <strong>${task.title}</strong>
                        <div class="small text-muted">
                            <span class="badge bg-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'success'}">
                                ${task.priority}
                            </span>
                            <span class="ms-2">${task.category}</span>
                            ${task.dueDate ? `<span class="ms-2"><i class="far fa-calendar"></i> ${task.dueDate}</span>` : ''}
                        </div>
                    </div>
                    <span class="badge ${task.status === "Completed" ? "bg-success" : "bg-warning"}">
                    ${task.status}
                    </span>

                `;
        list.appendChild(taskElement);
    });
}

function renderBoard() {
    const tasks = getTasks();
    const columns = {
        "Pending": document.getElementById("todo-list"),
        "In Progress": document.getElementById("progress-list"),
        "Completed": document.getElementById("done-list")
    };
    Object.values(columns).forEach(col => { if (col) col.innerHTML = ""; });

    const counters = {
        "Pending": document.getElementById("todo-count"),
        "In Progress": document.getElementById("progress-count"),
        "Completed": document.getElementById("done-count")
    };
    Object.values(counters).forEach(c => { if (c) c.textContent = "0"; });

    tasks.forEach((task, index) => {
        const col = columns[task.status] || columns["Pending"];
        if (!col) return;
        const identifier = task.id || task.createdAt;

        const card = document.createElement("div");
        card.className = "board-card";
        card.setAttribute("draggable", "true");
        card.dataset.id = identifier;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="fw-semibold">${task.title}</div>
                    ${task.description ? `<div class="meta">${task.description}</div>` : ""}
                    <div class="meta mt-1">
                        <span class="badge ${categoryStyles[task.category] || "bg-secondary"}">${task.category}</span>
                        <span class="ms-2">${task.priority}</span>
                        ${task.dueDate ? `<span class="ms-2"><i class="far fa-calendar"></i> ${task.dueDate}</span>` : ""}
                    </div>
                </div>
                <span class="badge ${task.status === "Completed" ? "bg-success" : task.status === "In Progress" ? "bg-info" : "bg-warning"}">${task.status}</span>
            </div>
            <div class="actions">
                <button class="btn btn-sm btn-outline-secondary" onclick="setTaskStatus(${index}, 'Pending')" ${task.status === "Pending" ? "disabled" : ""}>To Do</button>
                <button class="btn btn-sm btn-outline-info" onclick="setTaskStatus(${index}, 'In Progress')" ${task.status === "In Progress" ? "disabled" : ""}>In Progress</button>
                <button class="btn btn-sm btn-outline-success" onclick="setTaskStatus(${index}, 'Completed')" ${task.status === "Completed" ? "disabled" : ""}>Done</button>
                <button class="btn btn-sm btn-link text-decoration-none" onclick="editTask(${index})"><i class="fas fa-edit"></i></button>
            </div>
        `;
        col.appendChild(card);

        // Drag events per card
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", identifier);
            e.dataTransfer.effectAllowed = "move";
        });
    });

    Object.entries(counters).forEach(([status, el]) => {
        if (el) {
            const count = tasks.filter(t => (t.status || "Pending") === status).length;
            el.textContent = count;
        }
    });

    // Attach column drag targets
    Object.entries(columns).forEach(([status, col]) => {
        if (!col) return;
        col.addEventListener("dragover", (e) => {
            e.preventDefault();
            col.classList.add("drag-over");
        });
        col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
        col.addEventListener("drop", (e) => {
            e.preventDefault();
            col.classList.remove("drag-over");
            const id = e.dataTransfer.getData("text/plain");
            if (!id) return;
            setTaskStatusById(id, status);
        });
    });
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = "";

    const tasks = getTasks();
    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No categories yet</p>';
        return;
    }
    // Build categories summary from tasks
    const categories = {};
    tasks.forEach(task => {
        const cat = task.category || 'Other';
        if (!categories[cat]) categories[cat] = { total: 0, completed: 0 };
        categories[cat].total++;
        const st = (task.status || '').toString().toLowerCase();
        if (st === 'Completed' || st === 'completed') categories[cat].completed++;
    });
    const categoryColors = {
        'Work': 'category-work',
        'Personal': 'category-personal',
        'Study': 'category-study',
        'Health': 'category-health',
        'Finance': 'category-finance',
        'Other': 'category-other'
    };

    // Render category cards using categories and apply styles
    Object.entries(categories).forEach(([category, data]) => {
        const total = data.total || 0;
        const completed = data.completed || 0;
        const pending = total - completed;

        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
            <div class="category-card ${categoryColors[category] || 'category-other'}" data-category="${category}">
                <div class="card-body text-center">
                     <h3 class="display-6 mb-1">${total}</h3>
                     <p><strong>${category}</strong></p>
                     <p>${completed} completed • ${pending} pending</p>
                    <small>Click to view tasks</small>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    // Add click event to category cards
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            filterByCategory(category);
        });
    });
}

function filterByCategory(category) {
    const fc = document.getElementById('filter-category');
    if (fc) fc.value = category;
    showPage('filter');
    applyFilter();
}

function applyFilter() {
    let tasks = getTasks();
    if (!tasks) tasks = [];

    // Status
    const showCompleted = document.getElementById('filter-completed')?.checked;
    const showPending = document.getElementById('filter-pending')?.checked;

    tasks = tasks.filter(task => {
        const st = (task.status || '').toString().toLowerCase();
        if (!showCompleted && !showPending) return false;
        if (showCompleted && !showPending) return (st === 'Completed' || st === 'completed');
        if (!showCompleted && showPending) return (st === 'pending');
        return true;
    });

    // Priority
    const priorities = [];
    if (document.getElementById('filter-high')?.checked) priorities.push('High');
    if (document.getElementById('filter-medium')?.checked) priorities.push('Medium');
    if (document.getElementById('filter-low')?.checked) priorities.push('Low');
    if (priorities.length > 0) tasks = tasks.filter(t => priorities.includes(t.priority));

    // Category
    const category = document.getElementById('filter-category')?.value || 'all';
    if (category !== 'all') tasks = tasks.filter(t => t.category === category);

    // Due date
    const dueFilter = document.getElementById('filter-due-date')?.value || 'all';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueFilter !== 'all') {
        tasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            switch (dueFilter) {
                case 'today':
                    return dueDate.getTime() === today.getTime();
                case 'tomorrow':
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                    return dueDate.getTime() === tomorrow.getTime();
                case 'week':
                    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
                    return dueDate >= today && dueDate <= nextWeek;
                case 'overdue':
                    return dueDate < today;
                case 'future':
                    return dueDate > today;
                default:
                    return true;
            }
        });
    }

    displayFilteredTasks(tasks);
}

function displayFilteredTasks(tasks) {
    const container = document.getElementById('filtered-tasks-list');
    if (!container) return;
    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p class="text-muted">No tasks match your filters</p>';
        return;
    }

    tasks.forEach(task => {
        const identifier = task.id || task.createdAt;
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card mb-2 p-2 border rounded';
        taskElement.innerHTML = `
            <div class="task-header d-flex justify-content-between align-items-start">
                <div>
                    <div class="task-title fw-bold">${task.title}</div>
                    ${task.description ? `<div class="task-description small text-muted">${task.description}</div>` : ''}
                </div>
                <span class="task-status badge ${
                    task.status === 'completed' || task.status === 'Completed'
                        ? 'bg-success'
                        : task.status === 'In Progress'
                            ? 'bg-info'
                            : 'bg-warning'}">
                    ${task.status}
                </span>
            </div>
            <div class="task-meta small text-muted mt-2 d-flex gap-3">
                <span><i class="fas fa-folder me-1"></i>${task.category}</span>
                <span><i class="fas fa-flag me-1"></i>${task.priority}</span>
                ${task.dueDate ? `<span><i class="far fa-calendar me-1"></i>${task.dueDate}</span>` : ''}
            </div>
            <div class="task-actions mt-2">
                <button class="btn btn-sm btn-outline-primary edit-task" data-id="${identifier}"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-sm btn-outline-success complete-task" data-id="${identifier}"><i class="fas fa-check"></i> ${task.status === 'completed' || task.status === 'Completed' ? 'Undo' : 'Complete'}</button>
            </div>
        `;
        container.appendChild(taskElement);
    });

    // Attach listeners for edit/complete buttons
    container.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const tasksAll = getTasks();
            const index = tasksAll.findIndex(t => (t.id || t.createdAt) == id);
            if (index > -1) editTask(index);
        });
    });

    container.querySelectorAll('.complete-task').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const tasksAll = getTasks();
            const index = tasksAll.findIndex(t => (t.id || t.createdAt) == id);
            if (index > -1) toggleTaskStatus(index);
            // refresh the filtered view
            applyFilter();
        });
    });
}

/* =========================
   ANALYTICS & STATS
========================= */
function updateTaskStats() {
    const tasks = getTasks();

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const pending = total - completed;

    const today = new Date();
    const upcoming = tasks.filter(t => t.dueDate && new Date(t.dueDate) > today && t.status !== "Completed").length;

    // Dashboard stats
    ["total-tasks", "completed-tasks", "pending-tasks", "upcoming-tasks"].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.textContent = [total, completed, pending, upcoming][i];
    });

    // Completion rate
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const bar = document.getElementById("completion-rate-bar");
    const text = document.getElementById("completion-rate-text");
    if (bar) bar.style.width = `${rate}%`;
    if (text) text.textContent = `${rate}%`;

    // Average tasks per day
    if (tasks.length === 0) {
        document.getElementById("avg-tasks-per-day").textContent = "0";
    } else {
        const dates = tasks.map(t => new Date(t.createdAt).getTime());
        const days = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24) + 1;
        document.getElementById("avg-tasks-per-day").textContent = Math.round(total / days);
    }

    // Most productive day
    const dayCount = {};
    tasks.forEach(t => {
        const day = new Date(t.createdAt).toISOString().split("T")[0];
        dayCount[day] = (dayCount[day] || 0) + 1;
    });

    let mostProductiveDay = "undefined";
    if (Object.keys(dayCount).length > 0) {
        mostProductiveDay = Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b);
    }
    document.getElementById("most-productive-day").textContent = mostProductiveDay;
}

function renderAnalytics() {
    const tasks = getTasks();

    // Destroy old charts
    [completionChart, categoryChart, priorityChart].forEach(chart => chart?.destroy());

    // Completion Chart
    const completed = tasks.filter(t => t.status === "Completed").length;
    const pending = tasks.length - completed;
    const ctx1 = document.getElementById("completionChart")?.getContext("2d");
    if (ctx1) {
        completionChart = new Chart(ctx1, {
            type: "doughnut",
            data: {
                labels: ["Completed", "Pending"],
                datasets: [{ data: [completed, pending], backgroundColor: ["#28a745", "#ffc107"] }]
            },
            options: { plugins: { legend: { position: "bottom" } } }
        });
    }

    // Category Chart
    const categoryCount = {};
    tasks.forEach(t => categoryCount[t.category] = (categoryCount[t.category] || 0) + 1);
    const ctx2 = document.getElementById("categoryChart")?.getContext("2d");
    if (ctx2) {
        categoryChart = new Chart(ctx2, {
            type: "pie",
            data: {
                labels: Object.keys(categoryCount),
                datasets: [{
                    data: Object.values(categoryCount),
                    backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#0dcaf0", "#6f42c1"]
                }]
            },
            options: { plugins: { legend: { position: "bottom" } } }
        });
    }

    // Priority Chart
    const priorityCount = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach(t => priorityCount[t.priority]++);
    const ctx3 = document.getElementById("priorityChart")?.getContext("2d");
    if (ctx3) {
        priorityChart = new Chart(ctx3, {
            type: "bar",
            data: {
                labels: ["High", "Medium", "Low"],
                datasets: [{
                    label: "Tasks",
                    data: [priorityCount.High, priorityCount.Medium, priorityCount.Low],
                    backgroundColor: "#6f42c1"
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

/* =========================
   REFRESH ALL
========================= */
function refreshAll() {
    renderTasks();
    renderCategories();
    renderRecentTasks();
    updateTaskStats();
    renderAnalytics();
    renderBoard();
}

/* =========================
   FILTER PAGE
========================= */
document.getElementById("apply-filter")?.addEventListener("click", () => {
    const tasks = getTasks();
    const today = new Date().toISOString().split("T")[0];

    const statusFilters = [];
    if (document.getElementById("filter-completed").checked) statusFilters.push("Completed");
    if (document.getElementById("filter-pending").checked) statusFilters.push("Pending");

    const priorityFilters = [];
    if (document.getElementById("filter-high").checked) priorityFilters.push("High");
    if (document.getElementById("filter-medium").checked) priorityFilters.push("Medium");
    if (document.getElementById("filter-low").checked) priorityFilters.push("Low");

    const category = document.getElementById("filter-category").value;
    const dateType = document.getElementById("filter-due-date").value;

    let filtered = tasks.filter(task => {
        if (statusFilters.length && !statusFilters.includes(task.status)) return false;
        if (priorityFilters.length && !priorityFilters.includes(task.priority)) return false;
        if (category !== "all" && task.category !== category) return false;

        if (dateType === "today" && task.dueDate !== today) return false;
        if (dateType === "overdue" && (!task.dueDate || new Date(task.dueDate) >= new Date(today))) return false;
        if (dateType === "tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];
            if (task.dueDate !== tomorrowStr) return false;
        }
        if (dateType === "week") {
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() + 7);
            if (!task.dueDate || new Date(task.dueDate) > weekEnd) return false;
        }
        if (dateType === "future" && (!task.dueDate || new Date(task.dueDate) <= new Date(today))) return false;

        return true;
    });

    filtered.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

    const list = document.getElementById("filtered-tasks-list");
    list.innerHTML = "";
    if (filtered.length === 0) {
        list.innerHTML = "<p class='text-muted'>No tasks found</p>";
        return;
    }
    

    filtered.forEach(task => {
        const identifier = task.id || task.createdAt;
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card mb-2 p-2 border rounded';
        taskElement.innerHTML = `
            <div class="task-header d-flex justify-content-between align-items-start">
                <div>
                    <div class="task-title fw-bold">${task.title}</div>
                    ${task.description ? `<div class="task-description small text-muted">${task.description}</div>` : ''}
                </div>
                <span class="task-status badge ${task.status === 'completed' || task.status === 'Completed' ? 'bg-success' : 'bg-warning'}">
                    ${task.status}
                </span>
            </div>
            <div class="task-meta small text-muted mt-2 d-flex gap-3">
                <span><i class="fas fa-folder me-1"></i>${task.category}</span>
                <span><i class="fas fa-flag me-1"></i>${task.priority}</span>
                ${task.dueDate ? `<span><i class="far fa-calendar me-1"></i>${task.dueDate}</span>` : ''}
            </div>
            <div class="task-actions mt-2">
                <button class="btn btn-sm btn-outline-primary edit-task" data-id="${identifier}"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-sm btn-outline-success complete-task" data-id="${identifier}"><i class="fas fa-check"></i> ${task.status === 'completed' || task.status === 'Completed' ? 'Undo' : 'Complete'}</button>
            </div>
        `;
        list.appendChild(taskElement);
    });
    // Attach listeners for edit/complete buttons
    list.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const tasksAll = getTasks();
            const index = tasksAll.findIndex(t => (t.id || t.createdAt) == id);
            if (index > -1) editTask(index);
        });
    });

    list.querySelectorAll('.complete-task').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const tasksAll = getTasks();
            const index = tasksAll.findIndex(t => (t.id || t.createdAt) == id);
            if (index > -1) toggleTaskStatus(index);
            // refresh the filtered view
            applyFilter();
        });
    });

});

document.getElementById("reset-filter")?.addEventListener("click", () => {
    document.querySelectorAll("#filter-page input[type=checkbox]").forEach(cb => cb.checked = false);
    document.getElementById("filter-pending").checked = true;
    document.getElementById("filter-high").checked = true;
    document.getElementById("filter-medium").checked = true;
    document.getElementById("filter-low").checked = true;
    document.getElementById("filter-category").value = "all";
    document.getElementById("filter-due-date").value = "all";
    document.getElementById("filtered-tasks-list").innerHTML = "";
});

/* =========================
   SETTINGS & DARK MODE
========================= */
document.getElementById("dark-mode-toggle")?.addEventListener("change", function () {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    if (this.checked) {
        document.body.classList.add("dark-mode");
        settings.darkMode = true;
    } else {
        document.body.classList.remove("dark-mode");
        settings.darkMode = false;
    }
    localStorage.setItem("settings", JSON.stringify(settings));
});
document.addEventListener("DOMContentLoaded", () => {
    // ===== Elements =====
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const emailNoti = document.getElementById("email-notifications");
    const browserNoti = document.getElementById("browser-notifications");
    const dueDateReminders = document.getElementById("due-date-reminders");
    const saveBtn = document.getElementById("save-settings");
    const clearBtn = document.getElementById("clear-data");
    const exportBtn = document.getElementById("export-data");

    // ===== Load Settings =====
    const settings = JSON.parse(localStorage.getItem("settings")) || {
        darkMode: false,
        email: true,
        browser: true,
        reminders: true
    };

    // Apply settings
    darkModeToggle.checked = settings.darkMode;
    emailNoti.checked = settings.email;
    browserNoti.checked = settings.browser;
    dueDateReminders.checked = settings.reminders;

    if (settings.darkMode) {
        document.body.classList.add("dark-mode");
    }

    // ===== Save Settings =====
    saveBtn.addEventListener("click", () => {
        const newSettings = {
            darkMode: darkModeToggle.checked,
            email: emailNoti.checked,
            browser: browserNoti.checked,
            reminders: dueDateReminders.checked
        };

        localStorage.setItem("settings", JSON.stringify(newSettings));

        // Apply dark mode immediately
        document.body.classList.toggle("dark-mode", newSettings.darkMode);

        alert("Settings saved successfully!");
    });

    // ===== Clear All Data =====
    clearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all data?")) {
            localStorage.clear();
            location.reload();
        }
    });

    // ===== Export Data =====
    exportBtn.addEventListener("click", () => {
        const data = {
            settings: JSON.parse(localStorage.getItem("settings")),
            tasks: JSON.parse(localStorage.getItem("tasks"))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "task-manager-data.json";
        link.click();
    });
});



/* =========================
   INITIALIZATION
========================= */
document.addEventListener("DOMContentLoaded", () => {
    // Create hidden edit index input if missing
    if (!document.getElementById("task-edit-index")) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.id = "task-edit-index";
        document.getElementById("task-form").appendChild(input);
    }

    // Load dark mode
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    if (settings.darkMode) {
        document.body.classList.add("dark-mode");
        document.getElementById("dark-mode-toggle").checked = true;
    }

    // Default page
    showPage("dashboard");
    refreshAll();
});
