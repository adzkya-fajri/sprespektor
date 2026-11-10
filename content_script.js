/**
 * content_script.js - Injeksi Shadow DOM & Logika UI Overlay
 * Menggunakan IndexedDB (db.js) untuk penyimpanan data lokal transaksional
 */

(function () {
  // Cegah injeksi ganda jika skrip dijalankan ulang
  if (window.__TODO_OVERLAY_INITIALIZED__) return;
  window.__TODO_OVERLAY_INITIALIZED__ = true;

  const DAY_MS = 24 * 60 * 60 * 1000;

  // Helper formatting ISO YYYY-MM-DD
  function toISODateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseISODateString(isoStr) {
    const [y, m, d] = isoStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // State memori lokal dalam tab
  let state = {
    todos: [],
    currentFilter: "all", // 'all' | 'active' | 'completed'
    currentTab: "task",   // 'task' | 'calender'
    isOpen: false,
    isInputExpanded: false
  };

  // Buat Host Element untuk Shadow DOM
  const host = document.createElement("div");
  host.id = "todo-overlay-root-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Tautkan Stylesheet widget.css yang terisolasi di Shadow DOM
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("widget.css");
  shadow.appendChild(styleLink);

  // Buat Kontainer Utama Widget
  const wrapper = document.createElement("div");
  wrapper.className = "overlay-wrapper";
  wrapper.style.display = "none"; // Default tersembunyi hingga ikon toolbar diklik

  wrapper.innerHTML = `
    <div class="todo-card">
      <!-- 1. HEADER (SIMETRIS: LOGO, TABS, DAN TOMBOL "+") -->
      <header class="widget-header">
        <div class="header-left">
          <div class="brand-icon">▲</div>
          <nav class="nav-tabs" role="tablist">
            <button class="tab-btn active" id="btn-tab-task">
              <span>Task</span>
              <span class="tab-count-badge" id="badge-tab-count">0</span>
            </button>
            <button class="tab-btn" id="btn-tab-calender">
              <span>Calender</span>
            </button>
          </nav>
        </div>
        <button class="btn-toggle-add" id="btn-toggle-add" title="Tambah tugas baru (+)">+</button>
      </header>

      <!-- 2. EXPANDABLE INPUT FORM (MUNCUL HANYA SAAT "+" DIKLIK) -->
      <section class="expandable-drawer" id="expandable-drawer">
        <form id="add-task-form">
          <div class="input-row">
            <input 
              type="text" 
              id="task-title-input" 
              placeholder="Tulis tugas baru lalu tekan Enter..." 
              autocomplete="off" 
            />
            <span class="badge-hint-enter">↵ Enter</span>
          </div>
          <div class="date-picker-row">
            <span style="color:#64748b;">📅</span>
            <input type="date" id="task-date-picker" class="date-input-field" />
            <button type="button" class="shortcut-date-btn" id="btn-shortcut-today">Hari ini</button>
            <button type="button" class="shortcut-date-btn" id="btn-shortcut-tomorrow">Besok</button>
            <span class="date-preview-label" id="date-preview-label">(Hari ini)</span>
          </div>
        </form>
      </section>

      <!-- 3. TAB PANEL: TASK -->
      <div id="panel-task-view">
        <!-- Filter Bar -->
        <nav class="filter-bar">
          <button class="chip-btn active" data-filter="all">Semua</button>
          <button class="chip-btn" data-filter="active">Aktif</button>
          <button class="chip-btn" data-filter="completed">Selesai</button>
        </nav>

        <!-- Task List Scroll Area -->
        <main class="task-scroll-container">
          <ul class="task-list" id="task-list-ul"></ul>
          <div class="empty-state-box" id="empty-state-view" style="display:none;">
            <div class="empty-state-icon">📝</div>
            <p class="empty-state-text">Tidak ada tugas pada filter ini.</p>
          </div>
        </main>

        <!-- Footer Bar -->
        <footer class="widget-footer">
          <span id="footer-summary-text">0 tugas tersisa</span>
          <button class="btn-clear-done" id="btn-clear-done">Hapus selesai</button>
        </footer>
      </div>

      <!-- 4. TAB PANEL: CALENDER -->
      <div id="panel-calender-view" class="calender-panel">
        <div class="calender-header-meta">
          <span id="cal-month-title">November 2026</span>
          <span style="font-size:11px; color:#94a3b8;">Kalender Tugas</span>
        </div>
        <div class="calender-grid-week" id="cal-week-grid"></div>
        <div class="agenda-cards-list" id="cal-agenda-list"></div>
      </div>
    </div>
  `;

  shadow.appendChild(wrapper);

  // Referensi Elemen DOM dalam Shadow Root
  const btnTabTask = shadow.getElementById("btn-tab-task");
  const btnTabCalender = shadow.getElementById("btn-tab-calender");
  const badgeTabCount = shadow.getElementById("badge-tab-count");
  const btnToggleAdd = shadow.getElementById("btn-toggle-add");
  const expandableDrawer = shadow.getElementById("expandable-drawer");
  const addTaskForm = shadow.getElementById("add-task-form");
  const taskTitleInput = shadow.getElementById("task-title-input");
  const taskDatePicker = shadow.getElementById("task-date-picker");
  const btnShortcutToday = shadow.getElementById("btn-shortcut-today");
  const btnShortcutTomorrow = shadow.getElementById("btn-shortcut-tomorrow");
  const datePreviewLabel = shadow.getElementById("date-preview-label");
  const panelTaskView = shadow.getElementById("panel-task-view");
  const panelCalenderView = shadow.getElementById("panel-calender-view");
  const taskListUl = shadow.getElementById("task-list-ul");
  const emptyStateView = shadow.getElementById("empty-state-view");
  const footerSummaryText = shadow.getElementById("footer-summary-text");
  const btnClearDone = shadow.getElementById("btn-clear-done");
  const filterBtns = shadow.querySelectorAll(".chip-btn");
  const calWeekGrid = shadow.getElementById("cal-week-grid");
  const calAgendaList = shadow.getElementById("cal-agenda-list");

  // Inisialisasi Tanggal Hari Ini
  const todayDateStr = toISODateString(new Date());
  taskDatePicker.value = todayDateStr;

  /**
   * Menghitung Badge Hari Relatif (-9 hr, Hari ini, Besok, +N hr)
   */
  function calculateRelativeBadge(dateStr, isCompleted) {
    if (isCompleted) {
      return { label: "Selesai", cls: "rel-completed" };
    }
    if (!dateStr) {
      return { label: "Hari ini", cls: "rel-today" };
    }

    const targetDate = parseISODateString(dateStr);
    const todayDate = parseISODateString(todayDateStr);
    const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / DAY_MS);

    if (diffDays === 0) {
      return { label: "Hari ini", cls: "rel-today" };
    } else if (diffDays === 1) {
      return { label: "Besok", cls: "rel-tomorrow" };
    } else if (diffDays > 1) {
      return { label: `+${diffDays} hr`, cls: "rel-future" };
    } else {
      return { label: `${diffDays} hr`, cls: "rel-overdue" }; // e.g. -9 hr
    }
  }

  function updateDatePreview() {
    const rel = calculateRelativeBadge(taskDatePicker.value, false);
    datePreviewLabel.textContent = `(${rel.label})`;
  }

  /**
   * Render Daftar Tugas
   */
  function renderTasks() {
    taskListUl.innerHTML = "";

    const filtered = state.todos.filter(t => {
      if (state.currentFilter === "active") return !t.completed;
      if (state.currentFilter === "completed") return t.completed;
      return true;
    });

    if (filtered.length === 0) {
      emptyStateView.style.display = "flex";
    } else {
      emptyStateView.style.display = "none";
    }

    filtered.forEach(todo => {
      const li = document.createElement("li");
      li.className = `task-row ${todo.completed ? "completed" : ""}`;

      // Custom Checkbox
      const chkLabel = document.createElement("label");
      chkLabel.className = "custom-chk-label";

      const chkInput = document.createElement("input");
      chkInput.type = "checkbox";
      chkInput.checked = todo.completed;
      chkInput.addEventListener("change", () => toggleTodoStatus(todo.id));

      const chkBox = document.createElement("span");
      chkBox.className = "custom-chk-box";

      chkLabel.appendChild(chkInput);
      chkLabel.appendChild(chkBox);

      // Task Title & Due Badge Group
      const contentGroup = document.createElement("div");
      contentGroup.className = "task-content-group";
      contentGroup.addEventListener("click", () => toggleTodoStatus(todo.id));

      const titleText = document.createElement("span");
      titleText.className = "task-title-text";
      titleText.textContent = todo.text;

      const rel = calculateRelativeBadge(todo.dueDate, todo.completed);
      const relBadge = document.createElement("span");
      relBadge.className = `rel-day-badge ${rel.cls}`;
      relBadge.textContent = rel.label;

      contentGroup.appendChild(titleText);
      contentGroup.appendChild(relBadge);

      // Tombol Hapus (Muncul saat hover)
      const btnDel = document.createElement("button");
      btnDel.className = "btn-delete-row";
      btnDel.textContent = "✕";
      btnDel.title = "Hapus tugas";
      btnDel.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTodoItem(todo.id);
      });

      li.appendChild(chkLabel);
      li.appendChild(contentGroup);
      li.appendChild(btnDel);

      taskListUl.appendChild(li);
    });

    // Update Counter & Badge
    updateCounters();
  }

  function updateCounters() {
    const activeCount = state.todos.filter(t => !t.completed).length;
    badgeTabCount.textContent = activeCount;
    footerSummaryText.textContent = `${activeCount} tugas tersisa`;

    // Kirim pesan ke background service worker untuk update badge toolbar browser
    try {
      chrome.runtime.sendMessage({ action: "UPDATE_BADGE", count: activeCount });
    } catch (e) {
      // Background worker might be idle
    }
  }

  /**
   * Render Tab Kalender
   */
  function renderCalendar() {
    calWeekGrid.innerHTML = "";
    calAgendaList.innerHTML = "";

    const daysName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const now = new Date();
    const currDay = now.getDay();

    // Render 7 hari dalam minggu ini
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + (i - currDay) * DAY_MS);
      const iso = toISODateString(d);
      const isToday = iso === todayDateStr;

      const cell = document.createElement("div");
      cell.className = `cal-day-cell ${isToday ? "active-today" : ""}`;
      cell.innerHTML = `${daysName[d.getDay()]}<br><strong>${String(d.getDate()).padStart(2, "0")}</strong>`;
      calWeekGrid.appendChild(cell);
    }

    // Render agenda tugas
    state.todos.slice(0, 5).forEach(todo => {
      const card = document.createElement("div");
      card.className = "agenda-item-card";

      const rel = calculateRelativeBadge(todo.dueDate, todo.completed);
      card.innerHTML = `
        <div>
          <strong>${escapeHtml(todo.text)}</strong>
          <div style="font-size:10.5px; color:#94a3b8;">${todo.dueDate || "Hari ini"}</div>
        </div>
        <span class="rel-day-badge ${rel.cls}">${rel.label}</span>
      `;
      calAgendaList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Operasi Database IndexedDB
   */
  async function loadInitialData() {
    try {
      let todos = await todoDB.getAllTodos();

      // Seed data awal jika database baru pertama kali dibuka
      if (!todos || todos.length === 0) {
        const nineDaysAgo = new Date(Date.now() - 9 * DAY_MS);
        const threeDaysAhead = new Date(Date.now() + 3 * DAY_MS);

        const initialSeeds = [
          {
            id: "todo_" + Date.now(),
            text: "read the md",
            dueDate: todayDateStr,
            completed: false,
            createdAt: Date.now()
          },
          {
            id: "todo_" + (Date.now() - 1000),
            text: "read the md",
            dueDate: toISODateString(nineDaysAgo),
            completed: false,
            createdAt: Date.now() - 1000
          },
          {
            id: "todo_" + (Date.now() - 2000),
            text: "review manifest v3 architecture",
            dueDate: toISODateString(threeDaysAhead),
            completed: true,
            createdAt: Date.now() - 2000
          }
        ];

        for (const item of initialSeeds) {
          await todoDB.addTodo(item);
        }
        todos = await todoDB.getAllTodos();
      }

      state.todos = todos.sort((a, b) => b.createdAt - a.createdAt);
      renderTasks();
      renderCalendar();
    } catch (err) {
      console.error("Gagal memuat data dari IndexedDB:", err);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    const val = taskTitleInput.value.trim();
    const dateVal = taskDatePicker.value || todayDateStr;

    if (val) {
      const newTodo = {
        id: "todo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        text: val,
        dueDate: dateVal,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      try {
        await todoDB.addTodo(newTodo);
        state.todos.unshift(newTodo);
        taskTitleInput.value = "";
        renderTasks();
        renderCalendar();
        taskTitleInput.focus();
      } catch (err) {
        console.error("Gagal menyimpan tugas ke IndexedDB:", err);
      }
    }
  }

  async function toggleTodoStatus(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    todo.updatedAt = Date.now();

    try {
      await todoDB.updateTodo(todo);
      renderTasks();
      renderCalendar();
    } catch (err) {
      console.error("Gagal mengupdate tugas di IndexedDB:", err);
    }
  }

  async function deleteTodoItem(id) {
    try {
      await todoDB.deleteTodo(id);
      state.todos = state.todos.filter(t => t.id !== id);
      renderTasks();
      renderCalendar();
    } catch (err) {
      console.error("Gagal menghapus tugas dari IndexedDB:", err);
    }
  }

  async function clearCompletedTodos() {
    try {
      await todoDB.deleteCompletedTodos();
      state.todos = state.todos.filter(t => !t.completed);
      renderTasks();
      renderCalendar();
    } catch (err) {
      console.error("Gagal menghapus tugas selesai:", err);
    }
  }

  /**
   * Event Handlers UI
   */
  function toggleDrawerOpen() {
    state.isOpen = !state.isOpen;
    wrapper.style.display = state.isOpen ? "block" : "none";

    if (state.isOpen) {
      loadInitialData();
    } else {
      collapseInputDrawer();
    }
  }

  function toggleInputDrawer() {
    state.isInputExpanded = !state.isInputExpanded;
    expandableDrawer.classList.toggle("open", state.isInputExpanded);
    btnToggleAdd.classList.toggle("active", state.isInputExpanded);

    if (state.isInputExpanded) {
      switchTab("task");
      taskDatePicker.value = todayDateStr;
      updateDatePreview();
      setTimeout(() => taskTitleInput.focus(), 150);
    } else {
      taskTitleInput.blur();
    }
  }

  function collapseInputDrawer() {
    state.isInputExpanded = false;
    expandableDrawer.classList.remove("open");
    btnToggleAdd.classList.remove("active");
  }

  function switchTab(tabName) {
    state.currentTab = tabName;
    btnTabTask.classList.toggle("active", tabName === "task");
    btnTabCalender.classList.toggle("active", tabName === "calender");

    panelTaskView.style.display = tabName === "task" ? "block" : "none";
    panelCalenderView.style.display = tabName === "calender" ? "block" : "none";

    if (tabName === "calender") {
      collapseInputDrawer();
      renderCalendar();
    }
  }

  // Bind Events
  btnTabTask.addEventListener("click", () => switchTab("task"));
  btnTabCalender.addEventListener("click", () => switchTab("calender"));
  btnToggleAdd.addEventListener("click", toggleInputDrawer);
  addTaskForm.addEventListener("submit", handleCreateTask);
  taskDatePicker.addEventListener("change", updateDatePreview);

  btnShortcutToday.addEventListener("click", () => {
    taskDatePicker.value = todayDateStr;
    updateDatePreview();
  });

  btnShortcutTomorrow.addEventListener("click", () => {
    const tmr = new Date(Date.now() + DAY_MS);
    taskDatePicker.value = toISODateString(tmr);
    updateDatePreview();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  btnClearDone.addEventListener("click", clearCompletedTodos);

  // Keyboard shortcut Esc
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isOpen) {
      if (state.isInputExpanded) {
        collapseInputDrawer();
      } else {
        toggleDrawerOpen();
      }
    }
  });

  // Listener pesan dari Background Service Worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "TOGGLE_WIDGET") {
      toggleDrawerOpen();
      sendResponse({ isOpen: state.isOpen });
    }
    return true;
  });

  // Load awal
  loadInitialData();
})();
