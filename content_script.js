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

  // Inisialisasi Tanggal Hari Ini di Scope Teratas
  const todayDateStr = toISODateString(new Date());

  // State memori lokal dalam tab
  let state = {
    todos: [],
    currentFilter: "all", // 'all' | 'active' | 'completed'
    currentTab: "task",   // 'task' | 'calender'
    isOpen: false,
    isInputExpanded: false,
    calSelectedDate: todayDateStr,
    calWeekOffset: 0
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
  const isExtensionPage = window.location.protocol === "chrome-extension:";
  const wrapper = document.createElement("div");
  wrapper.className = "overlay-wrapper";
  wrapper.style.display = isExtensionPage ? "block" : "none"; // Langsung tampil jika dibuka di tab internal ekstensi
  state.isOpen = isExtensionPage;

  wrapper.innerHTML = `
    <div class="todo-card">
      <!-- 1. HEADER (SIMETRIS: TABS DI KIRI, TOMBOL "+" DI KANAN) -->
      <header class="widget-header">
        <nav class="nav-tabs" role="tablist">
          <button class="tab-btn active" id="btn-tab-task">
            <span>Task</span>
            <span class="tab-count-badge" id="badge-tab-count">0</span>
          </button>
          <button class="tab-btn" id="btn-tab-calender">
            <span>Calender</span>
          </button>
        </nav>
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
          <div class="shadcn-datepicker-wrap" id="shadcn-datepicker-wrap">
            <button type="button" class="shadcn-date-trigger" id="shadcn-date-trigger">
              <svg class="shadcn-cal-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              <span id="shadcn-trigger-label">Hari ini, 10 Nov</span>
              <span class="shadcn-relative-badge" id="shadcn-rel-badge">Hari ini</span>
            </button>
            <input type="hidden" id="task-date-picker" />

            <!-- Shadcn Floating Popover Calendar -->
            <div class="shadcn-popover" id="shadcn-popover" style="display: none;">
              <div class="shadcn-popover-header">
                <button type="button" class="shadcn-nav-arrow" id="shadcn-btn-prev" title="Bulan sebelumnya">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <span class="shadcn-month-title" id="shadcn-month-title">November 2026</span>
                <button type="button" class="shadcn-nav-arrow" id="shadcn-btn-next" title="Bulan berikutnya">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              <!-- Day of Week Row -->
              <div class="shadcn-weekdays-row">
                <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
              </div>

              <!-- Month Day Grid -->
              <div class="shadcn-days-grid" id="shadcn-days-grid"></div>

              <!-- Presets / Quick Actions -->
              <div class="shadcn-presets-row">
                <button type="button" class="shadcn-chip" id="shadcn-preset-today">Hari ini</button>
                <button type="button" class="shadcn-chip" id="shadcn-preset-tomorrow">Besok</button>
                <button type="button" class="shadcn-chip" id="shadcn-preset-nextweek">+7 Hari</button>
              </div>
            </div>
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
          <div class="cal-nav-group">
            <button class="cal-nav-btn" id="btn-cal-prev" title="Minggu Sebelumnya">◀</button>
            <span id="cal-month-title">November 2026</span>
            <button class="cal-nav-btn" id="btn-cal-next" title="Minggu Berikutnya">▶</button>
          </div>
          <button class="cal-nav-btn" id="btn-cal-today-shortcut" title="Kembali ke Hari Ini">Hari ini</button>
        </div>
        <div class="calender-grid-week" id="cal-week-grid"></div>
        <div class="agenda-title-row">
          <span id="agenda-date-heading">Agenda Hari Ini</span>
          <span id="agenda-count-heading">0 tugas</span>
        </div>
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
  const shadcnDatepickerWrap = shadow.getElementById("shadcn-datepicker-wrap");
  const shadcnDateTrigger = shadow.getElementById("shadcn-date-trigger");
  const shadcnTriggerLabel = shadow.getElementById("shadcn-trigger-label");
  const shadcnRelBadge = shadow.getElementById("shadcn-rel-badge");
  const shadcnPopover = shadow.getElementById("shadcn-popover");
  const shadcnBtnPrev = shadow.getElementById("shadcn-btn-prev");
  const shadcnBtnNext = shadow.getElementById("shadcn-btn-next");
  const shadcnMonthTitle = shadow.getElementById("shadcn-month-title");
  const shadcnDaysGrid = shadow.getElementById("shadcn-days-grid");
  const shadcnPresetToday = shadow.getElementById("shadcn-preset-today");
  const shadcnPresetTomorrow = shadow.getElementById("shadcn-preset-tomorrow");
  const shadcnPresetNextweek = shadow.getElementById("shadcn-preset-nextweek");

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
  taskDatePicker.value = todayDateStr;
  let popoverViewDate = parseISODateString(todayDateStr);

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

  function formatShadcnDateLabel(isoStr) {
    if (!isoStr) return "Pilih tanggal";
    const [y, m, d] = isoStr.split("-").map(Number);
    const monthShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][m - 1];
    return `${d} ${monthShort} ${y}`;
  }

  function updateShadcnTrigger() {
    const iso = taskDatePicker.value || todayDateStr;
    const rel = calculateRelativeBadge(iso, false);
    if (shadcnTriggerLabel) shadcnTriggerLabel.textContent = formatShadcnDateLabel(iso);
    if (shadcnRelBadge) {
      shadcnRelBadge.textContent = rel.label;
      shadcnRelBadge.className = `shadcn-relative-badge ${rel.cls}`;
    }
  }

  function renderShadcnPopoverGrid() {
    if (!shadcnDaysGrid || !shadcnMonthTitle) return;
    shadcnDaysGrid.innerHTML = "";

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const viewYear = popoverViewDate.getFullYear();
    const viewMonth = popoverViewDate.getMonth();

    shadcnMonthTitle.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    // Hari pertama dalam bulan
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    // Total hari dalam bulan saat ini
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Total hari dalam bulan sebelumnya
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Hari padding dari bulan sebelumnya
    for (let p = firstDay - 1; p >= 0; p--) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "shadcn-day-cell outside";
      cell.textContent = String(daysInPrevMonth - p);
      shadcnDaysGrid.appendChild(cell);
    }

    // Hari-hari dalam bulan saat ini
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("button");
      cell.type = "button";
      const mStr = String(viewMonth + 1).padStart(2, "0");
      const dStr = String(day).padStart(2, "0");
      const iso = `${viewYear}-${mStr}-${dStr}`;

      const isToday = iso === todayDateStr;
      const isSelected = iso === taskDatePicker.value;

      cell.className = `shadcn-day-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`;
      cell.textContent = String(day);

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        setPickedDate(iso);
        closeShadcnPopover();
      });

      shadcnDaysGrid.appendChild(cell);
    }

    // Hari padding penutup agar grid simetris 7 kolom
    const totalRendered = firstDay + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let r = 1; r <= remaining; r++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "shadcn-day-cell outside";
      cell.textContent = String(r);
      shadcnDaysGrid.appendChild(cell);
    }
  }

  function setPickedDate(iso) {
    taskDatePicker.value = iso;
    popoverViewDate = parseISODateString(iso);
    updateShadcnTrigger();
  }

  function toggleShadcnPopover(e) {
    if (e) e.stopPropagation();
    const isVisible = shadcnPopover && shadcnPopover.style.display !== "none";
    if (isVisible) {
      closeShadcnPopover();
    } else {
      openShadcnPopover();
    }
  }

  function openShadcnPopover() {
    if (!shadcnPopover) return;
    popoverViewDate = parseISODateString(taskDatePicker.value || todayDateStr);
    renderShadcnPopoverGrid();
    shadcnPopover.style.display = "block";
    shadcnDateTrigger.classList.add("open");
  }

  function closeShadcnPopover() {
    if (shadcnPopover) shadcnPopover.style.display = "none";
    if (shadcnDateTrigger) shadcnDateTrigger.classList.remove("open");
  }

  function updateDatePreview() {
    updateShadcnTrigger();
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
   * Render Tab Kalender (Interaktif Penuh: Klik Tanggal & Navigasi)
   */
  function renderCalendar() {
    calWeekGrid.innerHTML = "";
    calAgendaList.innerHTML = "";

    const daysName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const now = new Date();
    const currDay = now.getDay();
    // Tanggal dasar dengan offset minggu
    const baseDate = new Date(now.getTime() + (state.calWeekOffset * 7 * DAY_MS));
    const startOfWeek = new Date(baseDate.getTime() - (currDay * DAY_MS));

    // Update judul bulan kalender
    const monthTitleEl = shadow.getElementById("cal-month-title");
    if (monthTitleEl) {
      monthTitleEl.textContent = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
    }

    // Render 7 hari dalam minggu aktif
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek.getTime() + i * DAY_MS);
      const iso = toISODateString(d);
      const isToday = iso === todayDateStr;
      const isSelected = iso === state.calSelectedDate;

      const cell = document.createElement("div");
      cell.className = `cal-day-cell ${isToday ? "active-today" : ""} ${isSelected ? "selected-day" : ""}`;
      cell.innerHTML = `${daysName[d.getDay()]}<br><strong>${String(d.getDate()).padStart(2, "0")}</strong>`;

      // Event listener: KLIK SEL TANGGAL!
      cell.addEventListener("click", () => {
        state.calSelectedDate = iso;
        renderCalendar();
      });

      calWeekGrid.appendChild(cell);
    }

    // Filter tugas khusus untuk tanggal kalender yang dipilih
    const selectedDateTasks = state.todos.filter(t => t.dueDate === state.calSelectedDate);

    // Update heading tanggal agenda
    const headingDate = shadow.getElementById("agenda-date-heading");
    const headingCount = shadow.getElementById("agenda-count-heading");
    if (headingDate) {
      const rel = calculateRelativeBadge(state.calSelectedDate, false);
      headingDate.textContent = `Agenda: ${state.calSelectedDate} (${rel.label})`;
    }
    if (headingCount) {
      headingCount.textContent = `${selectedDateTasks.length} tugas`;
    }

    // Render daftar agenda atau empty state
    if (selectedDateTasks.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "agenda-empty-box";
      emptyDiv.innerHTML = `
        <span>Tidak ada tugas terjadwal pada tanggal ini.</span>
        <button class="btn-add-for-date" id="btn-add-for-this-date">+ Tambah tugas di tanggal ini</button>
      `;
      calAgendaList.appendChild(emptyDiv);

      emptyDiv.querySelector("#btn-add-for-this-date").addEventListener("click", () => {
        switchTab("task");
        if (!state.isInputExpanded) toggleInputDrawer();
        setPickedDate(state.calSelectedDate);
        setTimeout(() => taskTitleInput.focus(), 150);
      });
    } else {
      selectedDateTasks.forEach(todo => {
        const card = document.createElement("div");
        card.className = `agenda-item-card ${todo.completed ? "completed" : ""}`;

        const rel = calculateRelativeBadge(todo.dueDate, todo.completed);
        card.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; flex:1;">
            <span style="font-size:14px; font-weight:700; color:${todo.completed ? "#16a34a" : "#94a3b8"};">
              ${todo.completed ? "✓" : "○"}
            </span>
            <strong style="font-size:13px; color:#1e293b;">${escapeHtml(todo.text)}</strong>
          </div>
          <span class="rel-day-badge ${rel.cls}">${rel.label}</span>
        `;

        // Klik kartu agenda untuk toggle status selesai/belum
        card.addEventListener("click", async () => {
          await toggleTodoStatus(todo.id);
        });

        calAgendaList.appendChild(card);
      });
    }
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
      updateShadcnTrigger();
      setTimeout(() => taskTitleInput.focus(), 150);
    } else {
      taskTitleInput.blur();
      closeShadcnPopover();
    }
  }

  function collapseInputDrawer() {
    state.isInputExpanded = false;
    expandableDrawer.classList.remove("open");
    btnToggleAdd.classList.remove("active");
    closeShadcnPopover();
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
  taskDatePicker.addEventListener("change", updateShadcnTrigger);

  // Bind Shadcn Date Picker
  if (shadcnDateTrigger) {
    shadcnDateTrigger.addEventListener("click", toggleShadcnPopover);
  }

  if (shadcnBtnPrev) {
    shadcnBtnPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      popoverViewDate = new Date(popoverViewDate.getFullYear(), popoverViewDate.getMonth() - 1, 1);
      renderShadcnPopoverGrid();
    });
  }

  if (shadcnBtnNext) {
    shadcnBtnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      popoverViewDate = new Date(popoverViewDate.getFullYear(), popoverViewDate.getMonth() + 1, 1);
      renderShadcnPopoverGrid();
    });
  }

  if (shadcnPresetToday) {
    shadcnPresetToday.addEventListener("click", (e) => {
      e.stopPropagation();
      setPickedDate(todayDateStr);
      closeShadcnPopover();
    });
  }

  if (shadcnPresetTomorrow) {
    shadcnPresetTomorrow.addEventListener("click", (e) => {
      e.stopPropagation();
      const tmr = new Date(Date.now() + DAY_MS);
      setPickedDate(toISODateString(tmr));
      closeShadcnPopover();
    });
  }

  if (shadcnPresetNextweek) {
    shadcnPresetNextweek.addEventListener("click", (e) => {
      e.stopPropagation();
      const nextWeek = new Date(Date.now() + 7 * DAY_MS);
      setPickedDate(toISODateString(nextWeek));
      closeShadcnPopover();
    });
  }

  // Tutup popover saat klik di luar popover di dalam Shadow DOM
  shadow.addEventListener("click", (e) => {
    if (shadcnDatepickerWrap && !shadcnDatepickerWrap.contains(e.target)) {
      closeShadcnPopover();
    }
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

  // Kalender Navigation Events
  const btnCalPrev = shadow.getElementById("btn-cal-prev");
  const btnCalNext = shadow.getElementById("btn-cal-next");
  const btnCalToday = shadow.getElementById("btn-cal-today-shortcut");

  if (btnCalPrev) {
    btnCalPrev.addEventListener("click", () => {
      state.calWeekOffset -= 1;
      renderCalendar();
    });
  }

  if (btnCalNext) {
    btnCalNext.addEventListener("click", () => {
      state.calWeekOffset += 1;
      renderCalendar();
    });
  }

  if (btnCalToday) {
    btnCalToday.addEventListener("click", () => {
      state.calWeekOffset = 0;
      state.calSelectedDate = todayDateStr;
      renderCalendar();
    });
  }

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
