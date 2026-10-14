const STORAGE_KEY = 'gerenciador-compromissos-v1';

const state = {
  tasks: loadTasks(),
  activeView: 'home',
  filter: 'all',
  search: '',
  selectedDate: toISODate(new Date()),
  currentMonthDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};

const elements = {
  todayLabel: document.querySelector('#todayLabel'),
  todayCount: document.querySelector('#todayCount'),
  pendingCount: document.querySelector('#pendingCount'),
  completedCount: document.querySelector('#completedCount'),
  highPriorityCount: document.querySelector('#highPriorityCount'),
  taskList: document.querySelector('#taskList'),
  agendaList: document.querySelector('#agendaList'),
  calendarTitle: document.querySelector('#calendarTitle'),
  selectedDateTitle: document.querySelector('#selectedDateTitle'),
  calendarGrid: document.querySelector('#calendarGrid'),
  searchInput: document.querySelector('#searchInput'),
  taskModal: document.querySelector('#taskModal'),
  modalTitle: document.querySelector('#modalTitle'),
  taskForm: document.querySelector('#taskForm'),
  taskId: document.querySelector('#taskId'),
  taskTitle: document.querySelector('#taskTitle'),
  taskDescription: document.querySelector('#taskDescription'),
  taskDate: document.querySelector('#taskDate'),
  taskTime: document.querySelector('#taskTime'),
  taskLocation: document.querySelector('#taskLocation'),
  taskPriority: document.querySelector('#taskPriority'),
  taskCompleted: document.querySelector('#taskCompleted'),
  addTaskBtn: document.querySelector('#addTaskBtn'),
  closeModalBtn: document.querySelector('#closeModalBtn'),
  cancelTaskBtn: document.querySelector('#cancelTaskBtn'),
  prevMonthBtn: document.querySelector('#prevMonthBtn'),
  nextMonthBtn: document.querySelector('#nextMonthBtn'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  filterButtons: document.querySelectorAll('.filter-btn'),
};

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultTasks();
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeTask) : getDefaultTasks();
  } catch (error) {
    console.error('Erro ao carregar compromissos:', error);
    return getDefaultTasks();
  }
}

function getDefaultTasks() {
  const today = toISODate(new Date());
  const tomorrow = addDays(today, 1);
  const later = addDays(today, 3);

  return [
    {
      id: 'task-1',
      title: 'Reunião de orientação',
      description: 'Acompanhar o cronograma da UC8 e confirmar atividades.',
      date: today,
      time: '09:00',
      location: 'Sala 3',
      priority: 'alta',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Estudos de desenvolvimento mobile',
      description: 'Revisar os tópicos de Interface e persistência local.',
      date: tomorrow,
      time: '18:30',
      location: 'Biblioteca',
      priority: 'media',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Entrega do projeto',
      description: 'Finalizar e testar a versão local do app de compromissos.',
      date: later,
      time: '15:00',
      location: 'Laboratório',
      priority: 'alta',
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function normalizeTask(task) {
  return {
    id: task.id || makeId(),
    title: String(task.title || '').trim(),
    description: String(task.description || '').trim(),
    date: task.date || toISODate(new Date()),
    time: task.time || '09:00',
    location: String(task.location || '').trim(),
    priority: ['alta', 'media', 'baixa'].includes(task.priority) ? task.priority : 'media',
    completed: Boolean(task.completed),
    createdAt: task.createdAt || new Date().toISOString(),
  };
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function makeId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function bindEvents() {
  elements.addTaskBtn.addEventListener('click', () => openTaskModal());
  elements.closeModalBtn.addEventListener('click', closeTaskModal);
  elements.cancelTaskBtn.addEventListener('click', closeTaskModal);
  elements.taskForm.addEventListener('submit', handleFormSubmit);
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.activeView = button.dataset.view;
      render();
    });
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      renderFilters();
      render();
    });
  });

  elements.prevMonthBtn.addEventListener('click', () => {
    state.currentMonthDate = new Date(state.currentMonthDate.getFullYear(), state.currentMonthDate.getMonth() - 1, 1);
    renderCalendar();
  });

  elements.nextMonthBtn.addEventListener('click', () => {
    state.currentMonthDate = new Date(state.currentMonthDate.getFullYear(), state.currentMonthDate.getMonth() + 1, 1);
    renderCalendar();
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;

    const { action, id } = trigger.dataset;

    if (action === 'toggle-complete') {
      toggleTaskCompletion(id);
    }

    if (action === 'edit-task') {
      const task = state.tasks.find((item) => item.id === id);
      if (task) openTaskModal(task);
    }

    if (action === 'delete-task') {
      deleteTask(id);
    }

    if (action === 'select-date') {
      state.selectedDate = id;
      state.activeView = 'agenda';
      render();
    }
  });
}

function handleFormSubmit(event) {
  event.preventDefault();

  const title = elements.taskTitle.value.trim();
  const description = elements.taskDescription.value.trim();
  const date = elements.taskDate.value;
  const time = elements.taskTime.value;
  const location = elements.taskLocation.value.trim();
  const priority = elements.taskPriority.value;
  const completed = elements.taskCompleted.checked;

  if (!title || !date || !time || !location) {
    alert('Preencha todos os campos obrigatórios antes de salvar.');
    return;
  }

  const payload = {
    id: elements.taskId.value || makeId(),
    title,
    description,
    date,
    time,
    location,
    priority,
    completed,
    createdAt: new Date().toISOString(),
  };

  const existingIndex = state.tasks.findIndex((task) => task.id === payload.id);

  if (existingIndex >= 0) {
    state.tasks[existingIndex] = normalizeTask({ ...state.tasks[existingIndex], ...payload });
  } else {
    state.tasks.unshift(normalizeTask(payload));
  }

  persistTasks();
  closeTaskModal();
  render();
}

function openTaskModal(task = null) {
  const today = toISODate(new Date());

  if (task) {
    elements.modalTitle.textContent = 'Editar compromisso';
    elements.taskId.value = task.id;
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description;
    elements.taskDate.value = task.date;
    elements.taskTime.value = task.time;
    elements.taskLocation.value = task.location;
    elements.taskPriority.value = task.priority;
    elements.taskCompleted.checked = task.completed;
  } else {
    elements.modalTitle.textContent = 'Novo compromisso';
    elements.taskForm.reset();
    elements.taskId.value = '';
    elements.taskDate.value = state.selectedDate || today;
    elements.taskTime.value = '09:00';
    elements.taskPriority.value = 'media';
  }

  elements.taskModal.classList.remove('hidden');
  elements.taskModal.setAttribute('aria-hidden', 'false');
}

function closeTaskModal() {
  elements.taskModal.classList.add('hidden');
  elements.taskModal.setAttribute('aria-hidden', 'true');
  elements.taskForm.reset();
  elements.taskId.value = '';
}

function toggleTaskCompletion(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  task.completed = !task.completed;
  persistTasks();
  render();
}

function deleteTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  const confirmed = window.confirm(`Deseja excluir o compromisso "${task.title}"?`);
  if (!confirmed) return;

  state.tasks = state.tasks.filter((item) => item.id !== id);
  persistTasks();
  render();
}

function getVisibleTasks() {
  let tasks = [...state.tasks];

  if (state.filter === 'pending') {
    tasks = tasks.filter((task) => !task.completed);
  }

  if (state.filter === 'completed') {
    tasks = tasks.filter((task) => task.completed);
  }

  if (state.search) {
    tasks = tasks.filter((task) => task.title.toLowerCase().includes(state.search));
  }

  tasks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return tasks;
}

function render() {
  renderSummary();
  renderFilters();
  renderTaskList();
  renderCalendar();
  renderAgenda();

  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.view === state.activeView;
    button.classList.toggle('active', isActive);
  });

  const viewMap = {
    home: document.querySelector('#homeView'),
    agenda: document.querySelector('#agendaView'),
  };

  Object.entries(viewMap).forEach(([view, node]) => {
    node.classList.toggle('active', view === state.activeView);
  });
}

function renderSummary() {
  const today = toISODate(new Date());

  const todayTasks = state.tasks.filter((task) => task.date === today);
  const pendingCount = state.tasks.filter((task) => !task.completed).length;
  const completedCount = state.tasks.filter((task) => task.completed).length;
  const highPriorityCount = state.tasks.filter((task) => task.priority === 'alta' && !task.completed).length;

  elements.todayLabel.textContent = formatLongDate(today);
  elements.todayCount.textContent = String(todayTasks.length);
  elements.pendingCount.textContent = String(pendingCount);
  elements.completedCount.textContent = String(completedCount);
  elements.highPriorityCount.textContent = String(highPriorityCount);
}

function renderFilters() {
  elements.filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === state.filter);
  });
}

function renderTaskList() {
  const filtered = getVisibleTasks();

  if (!filtered.length) {
    elements.taskList.innerHTML = '<div class="empty-state">Nenhum compromisso encontrado para os filtros atuais.</div>';
    return;
  }

  const today = toISODate(new Date());

  elements.taskList.innerHTML = filtered
    .map((task) => {
      const isToday = task.date === today;
      const title = task.completed ? `<s>${escapeHtml(task.title)}</s>` : escapeHtml(task.title);
      const description = task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : '';

      return `
        <article class="task-card ${task.completed ? 'completed' : ''}">
          <div class="task-main">
            <button class="task-check" type="button" data-action="toggle-complete" data-id="${task.id}" aria-label="Marcar compromisso como concluído"></button>
            <div>
              <h3 class="task-title">${title}</h3>
              ${description}
              <div class="task-meta">
                <span>${isToday ? 'Hoje' : formatShortDate(task.date)}</span>
                <span>${escapeHtml(task.time)}</span>
                <span>${escapeHtml(task.location)}</span>
              </div>
            </div>
          </div>
          <div class="task-side">
            <span class="priority-badge priority-${task.priority}">${priorityLabel(task.priority)}</span>
            <div class="task-actions">
              <button type="button" data-action="edit-task" data-id="${task.id}">Editar</button>
              <button type="button" class="danger" data-action="delete-task" data-id="${task.id}">Excluir</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderCalendar() {
  const year = state.currentMonthDate.getFullYear();
  const month = state.currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalCells = 42;

  elements.calendarTitle.textContent = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(firstDay);

  const cells = [];
  const currentDate = new Date(firstDay);
  currentDate.setDate(1 - firstWeekday);

  for (let index = 0; index < totalCells; index += 1) {
    const cellDate = new Date(currentDate);
    const isoDate = toISODate(cellDate);
    const isCurrentMonth = cellDate.getMonth() === month;
    const isSelected = isoDate === state.selectedDate;
    const count = state.tasks.filter((task) => task.date === isoDate).length;

    cells.push(`
      <button
        type="button"
        class="calendar-day ${isCurrentMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''} ${count ? 'has-events' : ''}"
        data-action="select-date"
        data-id="${isoDate}"
        aria-label="Selecionar data ${formatLongDate(isoDate)}"
      >
        <span class="day-number">${cellDate.getDate()}</span>
        ${count ? `<span class="day-count">${count}</span>` : ''}
      </button>
    `);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  elements.calendarGrid.innerHTML = cells.join('');
}

function renderAgenda() {
  const selected = state.selectedDate || toISODate(new Date());
  const agendaTasks = state.tasks
    .filter((task) => task.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));

  elements.selectedDateTitle.textContent = `Compromissos de ${formatLongDate(selected)}`;

  if (!agendaTasks.length) {
    elements.agendaList.innerHTML = '<div class="empty-state">Nenhum compromisso para este dia.</div>';
    return;
  }

  const markup = agendaTasks
    .map((task) => {
      const title = task.completed ? `<s>${escapeHtml(task.title)}</s>` : escapeHtml(task.title);
      return `
        <article class="agenda-list-item">
          <div class="agenda-item-header">
            <h3>${title}</h3>
            <span class="priority-badge priority-${task.priority}">${priorityLabel(task.priority)}</span>
          </div>
          <div class="task-meta">
            <span>${escapeHtml(task.time)}</span>
            <span>${escapeHtml(task.location)}</span>
          </div>
          ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
          <div class="task-actions">
            <button type="button" data-action="toggle-complete" data-id="${task.id}">${task.completed ? 'Marcar pendente' : 'Concluir'}</button>
            <button type="button" data-action="edit-task" data-id="${task.id}">Editar</button>
            <button type="button" class="danger" data-action="delete-task" data-id="${task.id}">Excluir</button>
          </div>
        </article>
      `;
    })
    .join('');

  elements.agendaList.innerHTML = markup;
}

function priorityLabel(value) {
  const map = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
  };

  return map[value] || 'Média';
}

function formatLongDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

bindEvents();
render();
