/**
 * events.js — 重要事件模块
 *
 * 负责：
 *  - 添加重要事件（Modal 交互 + 数据写入）
 *  - 删除事件
 *  - 倒计时计算（Functional Spec 3.5.2）
 *  - 自动归档过期事件（Functional Spec 3.5.3）
 *  - 事件列表 HTML 渲染
 *  - 归档时间轴 HTML 渲染（Functional Spec 3.6）
 *
 * 数据结构（Functional Spec 3.5.1）：
 * {
 *   eventId, name, description, date, status("active"|"archived")
 * }
 */

/* ────────────────────────────────────────
   新建事件
──────────────────────────────────────── */

/**
 * 打开新建事件 Modal，重置表单。
 */
function openAddEvent() {
  $('ev-name').value = '';
  $('ev-desc').value = '';
  $('ev-date').value = '';
  openModal('modal-event');
}

/**
 * 读取表单，校验后写入 storage 并刷新视图。
 */
function saveEvent() {
  const name = $('ev-name').value.trim();
  const date = $('ev-date').value;

  if (!name || !date) {
    alert('请填写名称和日期');
    return;
  }

  const data = load();
  data.events.push({
    eventId:     uuid(),
    name,
    description: $('ev-desc').value.trim(),
    date,
    status:      'active',
  });

  save(data);
  closeModal('modal-event');
  render();
}

/* ────────────────────────────────────────
   删除事件
──────────────────────────────────────── */

/**
 * @param {string} id  eventId
 */
function deleteEvent(id) {
  if (!confirm('确定删除？')) return;
  const data = load();
  data.events = data.events.filter(e => e.eventId !== id);
  save(data);
  render();
}

/* ────────────────────────────────────────
   自动归档（Functional Spec 3.5.3）
──────────────────────────────────────── */

/**
 * 将日期已过的 active 事件标记为 archived。
 * 调用后需 save(data)。
 * @param {{ events: object[] }} data
 */
function autoArchiveEvents(data) {
  const td = today();
  data.events.forEach(ev => {
    if (ev.date < td) ev.status = 'archived';
  });
}

/* ────────────────────────────────────────
   倒计时计算（Functional Spec 3.5.2）
──────────────────────────────────────── */

/**
 * 计算目标日期距今天数（正数=未来，负数=已过）。
 * @param {string} eventDate  "YYYY-MM-DD"
 * @returns {number}
 */
function calcRemainingDays(eventDate) {
  return Math.ceil((new Date(eventDate) - new Date(today())) / 86_400_000);
}

/* ────────────────────────────────────────
   渲染：重要事件列表
──────────────────────────────────────── */

/**
 * 渲染倒计时列表到容器。
 * @param {object[]} list      active 事件数组
 * @param {HTMLElement} container
 */
function renderEvents(list, container) {
  if (!list.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📅</div>
        <p>还没有事件，点击右上角添加</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(ev => {
    const diff   = calcRemainingDays(ev.date);
    const passed = diff < 0;
    return `
      <div class="card event-card ${passed ? 'event-passed' : ''}">
        <div>
          <div class="countdown-num">${Math.abs(diff)}</div>
          <div class="countdown-unit">${passed ? '天前' : '天后'}</div>
        </div>
        <div class="event-info">
          <div class="event-name">${esc(ev.name)}</div>
          ${ev.description ? `<div class="event-desc">${esc(ev.description)}</div>` : ''}
          <div class="event-date">${ev.date}</div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteEvent('${ev.eventId}')">删除</button>
      </div>`;
  }).join('');
}

/* ────────────────────────────────────────
   渲染：归档时间轴（Functional Spec 3.6）
──────────────────────────────────────── */

/**
 * 渲染归档时间轴到容器（时间倒序）。
 * @param {object[]} list      archived 事件数组（已排序）
 * @param {HTMLElement} container
 */
function renderArchive(list, container) {
  if (!list.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🗃️</div>
        <p>还没有已归档的事件</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(ev => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">${ev.date}</div>
      <div class="timeline-content">
        <div class="timeline-name">${esc(ev.name)}</div>
        ${ev.description ? `<div class="timeline-desc">${esc(ev.description)}</div>` : ''}
      </div>
      <button class="btn btn-sm btn-danger" onclick="deleteEvent('${ev.eventId}')">删除</button>
    </div>`).join('');
}
