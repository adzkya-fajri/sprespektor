/**
 * popup.js - Logika Interaksi Jendela Popup Extension Manifest V3
 * Berbasis IndexedDB murni (db.js) tanpa ketergantungan server lokal
 */

(function () {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const todoDB = new TodoDatabase();

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

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  const todayDateStr = toISODateString(new Date());

  // State
  let state = {
    todos: [],
    currentFilter: "all",
    currentTab: "task",
    isInputExpanded: false,
    calSelectedDate: todayDateStr,
    calWeekOffset: 0
  };

  // DOM Elements
  const btnTabTask = document.getElementById("btn-tab-task");
  const btnTabCalender = document.getElementById("btn-tab-calender");
  const badgeTabCount = document.getElementById("badge-tab-count");
  const btnToggleAdd = document.getElementById("btn-toggle-add");
  const expandableDrawer = document.getElementById("expandable-drawer");
  const addTaskForm = document.getElementById("add-task-form");
  const taskTitleInput = document.getElementById("task-title-input");
  const taskDatePicker = document.getElementById("task-date-picker");

  // Shadcn Date Picker Elements
  const shadcnDatepickerWrap = document.getElementById("shadcn-datepicker-wrap");
  const shadcnDateTrigger = document.getElementById("shadcn-date-trigger");
  const shadcnTriggerLabel = document.getElementById("shadcn-trigger-label");
  const shadcnRelBadge = document.getElementById("shadcn-rel-badge");
  const shadcnPopover = document.getElementById("shadcn-popover");
  const shadcnBtnPrev = document.getElementById("shadcn-btn-prev");
  const shadcnBtnNext = document.getElementById("shadcn-btn-next");
  const shadcnMonthTitle = document.getElementById("shadcn-month-title");
  const shadcnDaysGrid = document.getElementById("shadcn-days-grid");
  const shadcnPresetToday = document.getElementById("shadcn-preset-today");
  const shadcnPresetTomorrow = document.getElementById("shadcn-preset-tomorrow");
  const shadcnPresetNextweek = document.getElementById("shadcn-preset-nextweek");

  // Task & Calendar View Elements
  const panelTaskView = document.getElementById("panel-task-view");
  const panelCalenderView = document.getElementById("panel-calender-view");
  const taskListUl = document.getElementById("task-list-ul");
  const emptyStateView = document.getElementById("empty-state-view");
  const footerSummaryText = document.getElementById("footer-summary-text");
  const btnClearDone = document.getElementById("btn-clear-done");
  const filterBtns = document.querySelectorAll(".chip-btn");
  const calWeekGrid = document.getElementById("cal-week-grid");
  const calAgendaList = document.getElementById("cal-agenda-list");

  // Inisialisasi Tanggal
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
      return { label: `${diffDays} hr`, cls: "rel-overdue" };
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

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Prev month padding
    for (let p = firstDay - 1; p >= 0; p--) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "shadcn-day-cell outside";
      cell.textContent = String(daysInPrevMonth - p);
      shadcnDaysGrid.appendChild(cell);
    }

    // Days of current month
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
      emptyStateView.style.display = "block";
    } else {
      emptyStateView.style.display = "none";
      filtered.forEach(todo => {
        const li = document.createElement("li");
        li.className = `task-item ${todo.completed ? "completed" : ""}`;

        const leftWrap = document.createElement("div");
        leftWrap.className = "task-left-wrap";

        const chkLabel = document.createElement("label");
        chkLabel.className = "circle-checkbox-wrapper";

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = todo.completed;
        chk.addEventListener("change", () => toggleTodoStatus(todo.id));

        const customSpan = document.createElement("span");
        customSpan.className = "circle-checkbox-custom";

        chkLabel.appendChild(chk);
        chkLabel.appendChild(customSpan);

        const textSpan = document.createElement("span");
        textSpan.className = "task-text";
        textSpan.textContent = todo.text;

        leftWrap.appendChild(chkLabel);
        leftWrap.appendChild(textSpan);

        const rightWrap = document.createElement("div");
        rightWrap.style.display = "flex";
        rightWrap.style.alignItems = "center";
        rightWrap.style.gap = "8px";

        const rel = calculateRelativeBadge(todo.dueDate, todo.completed);
        const badgeSpan = document.createElement("span");
        badgeSpan.className = `rel-day-badge ${rel.cls}`;
        badgeSpan.textContent = rel.label;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn-delete-task";
        delBtn.innerHTML = "✕";
        delBtn.title = "Hapus tugas";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteTodoItem(todo.id);
        });

        rightWrap.appendChild(badgeSpan);
        rightWrap.appendChild(delBtn);

        li.appendChild(leftWrap);
        li.appendChild(rightWrap);
        taskListUl.appendChild(li);
      });
    }

    updateSummaryStats();
  }

  function updateSummaryStats() {
    const activeCount = state.todos.filter(t => !t.completed).length;
    footerSummaryText.textContent = `${activeCount} tugas tersisa`;
    badgeTabCount.textContent = String(activeCount);

    // Update Chrome Toolbar Badge
    if (chrome && chrome.action && chrome.action.setBadgeText) {
      const badgeText = activeCount > 0 ? String(activeCount) : "";
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
    }
  }

  /**
   * Render Tab Kalender
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
    const baseDate = new Date(now.getTime() + (state.calWeekOffset * 7 * DAY_MS));
    const startOfWeek = new Date(baseDate.getTime() - (currDay * DAY_MS));

    const monthTitleEl = document.getElementById("cal-month-title");
    if (monthTitleEl) {
      monthTitleEl.textContent = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
    }

    // 7 Hari dalam seminggu
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek.getTime() + i * DAY_MS);
      const iso = toISODateString(d);
      const isToday = iso === todayDateStr;
      const isSelected = iso === state.calSelectedDate;

      const cell = document.createElement("div");
      cell.className = `cal-day-cell ${isToday ? "active-today" : ""} ${isSelected ? "selected-day" : ""}`;
      cell.innerHTML = `${daysName[d.getDay()]}<br><strong>${String(d.getDate()).padStart(2, "0")}</strong>`;

      cell.addEventListener("click", () => {
        state.calSelectedDate = iso;
        renderCalendar();
      });

      calWeekGrid.appendChild(cell);
    }

    const selectedDateTasks = state.todos.filter(t => t.dueDate === state.calSelectedDate);

    const headingDate = document.getElementById("agenda-date-heading");
    const headingCount = document.getElementById("agenda-count-heading");
    if (headingDate) {
      const rel = calculateRelativeBadge(state.calSelectedDate, false);
      headingDate.textContent = `Agenda: ${state.calSelectedDate} (${rel.label})`;
    }
    if (headingCount) {
      headingCount.textContent = `${selectedDateTasks.length} tugas`;
    }

    if (selectedDateTasks.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "agenda-empty-box";
      emptyDiv.innerHTML = `
        <span>Tidak ada tugas terjadwal pada tanggal ini.</span>
        <button type="button" class="btn-add-for-date" id="btn-add-for-this-date">+ Tambah tugas di tanggal ini</button>
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
            <strong style="font-size:13px; color:#1e293b; ${todo.completed ? "text-decoration:line-through; opacity:0.6;" : ""}">${escapeHtml(todo.text)}</strong>
          </div>
          <span class="rel-day-badge ${rel.cls}">${rel.label}</span>
        `;

        card.addEventListener("click", async () => {
          await toggleTodoStatus(todo.id);
        });

        calAgendaList.appendChild(card);
      });
    }
  }

  /**
   * Operasi IndexedDB
   */
  async function loadInitialData() {
    try {
      let todos = await todoDB.getAllTodos();

      if (!todos || todos.length === 0) {
        const seedTodos = [
          {
            id: "todo_1",
            text: "Evaluasi UI/UX Chrome Extension To-Do List",
            dueDate: todayDateStr,
            completed: false,
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 3600000
          },
          {
            id: "todo_2",
            text: "Uji coba komponen Shadcn/ui Date Picker",
            dueDate: todayDateStr,
            completed: false,
            createdAt: Date.now() - 1800000,
            updatedAt: Date.now() - 1800000
          }
        ];
        for (const t of seedTodos) {
          await todoDB.addTodo(t);
        }
        todos = seedTodos;
      }

      state.todos = todos;
      updateShadcnTrigger();
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
  function toggleInputDrawer() {
    state.isInputExpanded = !state.isInputExpanded;
    expandableDrawer.classList.toggle("open", state.isInputExpanded);
    btnToggleAdd.classList.toggle("active", state.isInputExpanded);

    if (state.isInputExpanded) {
      switchTab("task");
      setPickedDate(todayDateStr);
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

  // Tutup popover saat klik di luar popover
  document.addEventListener("click", (e) => {
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
  const btnCalPrev = document.getElementById("btn-cal-prev");
  const btnCalNext = document.getElementById("btn-cal-next");
  const btnCalToday = document.getElementById("btn-cal-today-shortcut");

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
    if (e.key === "Escape") {
      if (state.isInputExpanded) {
        collapseInputDrawer();
      }
    }
  });

  // Load awal
  loadInitialData();
})();
