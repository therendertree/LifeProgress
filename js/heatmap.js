/**
 * heatmap.js — 热力图模块
 *
 * 负责：
 *  - 将 plan.records 聚合为 { "YYYY-MM-DD": count } 字典
 *  - 生成过去 12 个月的 GitHub 风格热力图 DOM
 *
 * 颜色规则（Functional Spec 3.4.4）：
 *   0  → 透明（bg3）
 *   1  → 浅色
 *   2  → 中色
 *   3+ → 深色（accent）
 */

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ────────────────────────────────────────
   数据聚合
──────────────────────────────────────── */

/**
 * 将 records 数组聚合为日期 → 打卡次数的字典。
 * @param {Array<{date: string, value: number}>} records
 * @returns {Object.<string, number>}
 */
function buildHeatmapData(records) {
  const map = {};
  records.forEach(r => {
    map[r.date] = (map[r.date] || 0) + r.value;
  });
  return map;
}

/* ────────────────────────────────────────
   日期工具
──────────────────────────────────────── */

/**
 * 将 Date 转为 "YYYY-MM-DD" 字符串。
 * @param {Date} d
 * @returns {string}
 */
function dateKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * 计算过去 12 个月的周数组，每周含 7 个 Date。
 * 起点对齐到周日（与 GitHub 热力图一致）。
 * @returns {Date[][]}
 */
function buildWeeks() {
  const end   = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  const weeks = [];
  const cur   = new Date(start);

  while (cur <= end) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

/* ────────────────────────────────────────
   渲染
──────────────────────────────────────── */

/**
 * 将热力图渲染到指定容器。
 * @param {HTMLElement} container
 * @param {Object.<string, number>} map  日期→数量字典
 */
function renderHeatmap(container, map) {
  const weeks   = buildWeeks();
  const now     = new Date();

  // 月份标签行
  // const monthsHtml = weeks.map(week => {
  //   const d       = week[0];
  //   const isFirst = d.getDate() <= 7;
  //   const label   = isFirst ? MONTH_LABELS[d.getMonth()] : '&nbsp;';
  //   return `<div class="heatmap-month-label" style="min-width:15px">${label}</div>`;
  // }).join('');
  let lastMonth = -1;
  const monthsHtml = weeks.map((week) => {
  // 找这一列中第一个属于本月的日期
    const firstInMonth = week.find(d => d <= now);
    const d = week[0];
    const month = d.getMonth();
    let label = '&nbsp;';
    if (month !== lastMonth) {
      label = MONTH_LABELS[month];
      lastMonth = month;
    }
    return `<div class="heatmap-month-label" style="min-width:15px">${label}</div>`;
  }).join('');

  // 格子列
  const gridHtml = weeks.map(week => {
    const cells = week.map(d => {
      const key    = dateKey(d);
      const v      = map[key] || 0;
      const level  = v === 0 ? 0 : v === 1 ? 1 : v <= 3 ? 2 : 3;
      const future = d > now ? 'style="opacity:0.3"' : '';
      const tip    = v ? `${key} · ${Math.round(v)}次` : key;
      return `
        <div class="tooltip-wrap heatmap-cell" data-v="${level}" ${future}>
          <div class="tooltip">${tip}</div>
        </div>`;
    }).join('');
    return `<div class="heatmap-col">${cells}</div>`;
  }).join('');

  container.innerHTML = `
    <div class="heatmap-wrap">
      <div class="heatmap-months" style="display:flex;gap:3px">${monthsHtml}</div>
      <div class="heatmap-grid">${gridHtml}</div>
    </div>`;
}
