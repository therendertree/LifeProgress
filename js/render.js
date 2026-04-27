/**
 * render.js — 视图渲染调度模块
 *
 * 负责统一调度各页面的渲染逻辑：
 *  - 首页（进度条列表 + 热力图 Tab）
 *  - 所有计划页（列表 + 聚合热力图）
 *  - 重要事件页
 *  - 归档页
 *
 * 依赖：storage.js / utils.js / plans.js / heatmap.js / events.js
 */

/* 记录首页热力图当前选中的 planId */
let _selectedHeatmapPlanId = null;

/* ────────────────────────────────────────
   热力图 Tab 切换（首页）
──────────────────────────────────────── */

/**
 * 切换首页热力图显示的计划。
 * @param {string} planId
 */
function selectHeatmapPlan(planId) {
  _selectedHeatmapPlanId = planId;
  render();
}

/* ────────────────────────────────────────
   主渲染函数
──────────────────────────────────────── */

/**
 * 读取最新数据，执行自动归档，然后刷新所有页面 DOM。
 * 每次用户操作后调用此函数保持视图同步。
 */
function render() {
  const data = load();

  // 自动归档过期事件，并持久化
  autoArchiveEvents(data);
  save(data);

  // 数据分类
  const activePlans    = data.plans.filter(p => p.status !== 'completed');
  const donePlans      = data.plans.filter(p => p.status === 'completed');
  const sortedPlans    = [...activePlans, ...donePlans];

  const activeEvents   = data.events
    .filter(e => e.status === 'active')
    .sort((a, b) => a.date.localeCompare(b.date));

  const archivedEvents = data.events
    .filter(e => e.status === 'archived')
    .sort((a, b) => b.date.localeCompare(a.date));

  /* ── 首页 ── */
  _renderHomePlans(data, sortedPlans);
  _renderHomeHeatmap(data);

  /* ── 所有计划页 ── */
  _renderAllPlans(sortedPlans);
  _renderAllHeatmap(data);

  /* ── 重要事件页 ── */
  renderEvents(activeEvents, $('events-list'));

  /* ── 归档页 ── */
  renderArchive(archivedEvents, $('archive-list'));
}

/* ────────────────────────────────────────
   内部渲染函数
──────────────────────────────────────── */

/**
 * 渲染首页计划列表。
 */
function _renderHomePlans(data, sortedPlans) {
  const container = $('home-plans-list');
  if (!data.plans.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎯</div>
        <p>还没有计划，点击「新建计划」开始你的人生进度追踪</p>
      </div>`;
  } else {
    container.innerHTML = sortedPlans.map(progressHtml).join('');
  }
}

/**
 * 渲染首页热力图及其 Tab 切换器。
 */
function _renderHomeHeatmap(data) {
  const tabsEl = $('heatmap-plan-tabs');

  if (!data.plans.length) {
    tabsEl.innerHTML = '';
    $('home-heatmap').innerHTML = '';
    return;
  }

  // 若选中的计划已删除，重置为第一个
  if (!_selectedHeatmapPlanId || !data.plans.find(p => p.planId === _selectedHeatmapPlanId)) {
    _selectedHeatmapPlanId = data.plans[0].planId;
  }

  // 渲染 Tab
  tabsEl.innerHTML = data.plans.map(p => `
    <div
      class="tab${p.planId === _selectedHeatmapPlanId ? ' active' : ''}"
      onclick="selectHeatmapPlan('${p.planId}')"
    >${esc(p.name)}</div>`
  ).join('');

  // 渲染热力图
  const selected = data.plans.find(p => p.planId === _selectedHeatmapPlanId);
  if (selected) {
    renderHeatmap($('home-heatmap'), buildHeatmapData(selected.records));
  }
}

/**
 * 渲染所有计划页列表。
 */
function _renderAllPlans(sortedPlans) {
  const container = $('all-plans-list');
  if (!sortedPlans.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📋</div>
        <p>暂无计划</p>
      </div>`;
  } else {
    container.innerHTML = sortedPlans.map(progressHtml).join('');
  }
}

/**
 * 渲染所有计划页的聚合热力图。
 */
function _renderAllHeatmap(data) {
  // 聚合所有计划的 records（Functional Spec 3.4.3）
  const allMap = {};
  data.plans.forEach(p => {
    p.records.forEach(r => {
      allMap[r.date] = (allMap[r.date] || 0) + r.value;
    });
  });
  renderHeatmap($('all-heatmap'), allMap);
}
