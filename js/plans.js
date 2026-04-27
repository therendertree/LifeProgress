/**
 * plans.js — 计划管理模块
 *
 * 负责：
 *  - 新建计划（Modal 交互 + 数据写入）
 *  - 删除计划
 *  - 打卡逻辑（等距 / 按量）
 *  - 进度计算与完成判定
 *  - 计划卡片 HTML 生成
 *
 * 数据结构（Functional Spec 3.1.2）：
 * {
 *   planId, name, type("equal"|"quantity"),
 *   target, current, color, records, status, createdAt
 * }
 */

/* 可选颜色列表 */
const COLORS = [
  '#c8f04a', '#4ab4f0', '#f04a4a',
  '#f0b44a', '#b44af0', '#4af0b4',
  '#f04ab4', '#ffffff',
];
let selectedColor  = COLORS[0];
let checkinPlanId  = null;   // 当前待打卡的 planId

/* ────────────────────────────────────────
   颜色选择器
──────────────────────────────────────── */

/**
 * 渲染颜色选择器色块。
 */
function buildColorPicker() {
  const el = $('color-picker');
  el.innerHTML = '';
  COLORS.forEach(c => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (c === selectedColor ? ' selected' : '');
    swatch.style.background = c;
    swatch.onclick = () => {
      selectedColor = c;
      document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
      swatch.classList.add('selected');
    };
    el.appendChild(swatch);
  });
}

/* ────────────────────────────────────────
   新建计划
──────────────────────────────────────── */

/**
 * 打开新建计划 Modal，重置表单。
 */
function openAddPlan() {
  $('plan-name').value  = '';
  $('plan-type').value  = 'equal';
  $('plan-target').value = '';
  selectedColor = COLORS[0];
  buildColorPicker();
  togglePlanTypeHint();
  openModal('modal-plan');
}

/**
 * 根据计划类型更新「目标」字段的标签和占位符。
 */
function togglePlanTypeHint() {
  const isEqual = $('plan-type').value === 'equal';
  $('target-label').textContent   = isEqual ? '目标次数' : '目标总量';
  $('plan-target').placeholder    = isEqual ? '20' : '3650';
}

/**
 * 读取表单，校验后写入 storage 并刷新视图。
 */
function savePlan() {
  const name   = $('plan-name').value.trim();
  const target = parseFloat($('plan-target').value);

  if (!name || !target || target <= 0) {
    alert('请填写完整信息');
    return;
  }

  const data = load();
  data.plans.push({
    planId:    uuid(),
    name,
    type:      $('plan-type').value,
    target,
    current:   0,
    color:     selectedColor,
    records:   [],
    status:    'ongoing',
    createdAt: today(),
  });

  save(data);
  closeModal('modal-plan');
  render();
}

/* ────────────────────────────────────────
   删除计划
──────────────────────────────────────── */

/**
 * @param {string} planId
 */
function deletePlan(planId) {
  if (!confirm('确定删除这个计划？')) return;
  const data = load();
  data.plans = data.plans.filter(p => p.planId !== planId);
  save(data);
  render();
}

/* ────────────────────────────────────────
   打卡
──────────────────────────────────────── */

/**
 * 打开打卡 Modal，展示当前计划进度信息。
 * @param {string} planId
 */
function openCheckin(planId) {
  const data = load();
  const plan = data.plans.find(p => p.planId === planId);
  if (!plan) return;

  checkinPlanId = planId;
  $('ci-name').textContent = plan.name;

  const pct = Math.min(100, Math.round(plan.current / plan.target * 100));
  const progress = plan.type === 'equal'
    ? `${plan.current}/${plan.target} 次`
    : `${plan.current}/${plan.target}`;
  $('ci-info').textContent = `当前进度 ${pct}%   ${progress}`;

  const qtyGroup = $('ci-qty-group');
  if (plan.type === 'quantity') {
    qtyGroup.style.display = 'block';
    $('ci-qty').value = '';
  } else {
    qtyGroup.style.display = 'none';
  }

  openModal('modal-checkin');
}

/**
 * 确认打卡：
 *  - equal   型：current += 1
 *  - quantity 型：current += inputValue
 * 更新 records，判断是否完成，写入 storage。
 */
function submitCheckin() {
  const data = load();
  const plan = data.plans.find(p => p.planId === checkinPlanId);
  if (!plan) return;

  let value = 1;
  if (plan.type === 'quantity') {
    value = parseFloat($('ci-qty').value);
    if (!value || value <= 0) {
      alert('请输入有效数量');
      return;
    }
  }

  // 更新 current（Functional Spec 3.2.2 / 3.2.3）
  plan.current = Math.min(plan.target, plan.current + value);

  // 完成判定（Functional Spec 3.2.4）
  if (plan.current >= plan.target) plan.status = 'completed';

  // 写入 records（同一天累加）
  const td = today();
  const rec = plan.records.find(r => r.date === td);
  if (rec) rec.value += value;
  else plan.records.push({ date: td, value });

  save(data);
  closeModal('modal-checkin');
  render();
}

/* ────────────────────────────────────────
   计划卡片 HTML 模板
──────────────────────────────────────── */

/**
 * 生成单个计划的进度条卡片 HTML 字符串。
 * @param {object} plan
 * @returns {string}
 */
function progressHtml(plan) {
  const pct     = Math.min(100, plan.current / plan.target * 100);
  const display = Math.min(100, Math.round(pct));
  const typeLabel = plan.type === 'equal' ? '等距' : '按量';
  const unit      = plan.type === 'quantity' ? ' 量' : ' 次';
  const opacity   = plan.status === 'completed' ? 0.7 : 1;

  const footer = plan.status === 'completed'
    ? `<span class="badge-done">✓ 已完成</span>`
    : `<button class="btn btn-sm btn-accent" onclick="openCheckin('${plan.planId}')">打卡</button>`;

  return `
    <div class="card" style="opacity:${opacity}">
      <div class="plan-header">
        <div>
          <div class="plan-name">
            ${esc(plan.name)}
            <span class="tag-type">${typeLabel}</span>
          </div>
          <div class="plan-meta">${plan.current} / ${plan.target}${unit}</div>
        </div>
        <div style="text-align:right">
          <div class="plan-pct">${display}%</div>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:${plan.color}"></div>
      </div>
      <div class="plan-footer">
        <div>${footer}</div>
        <button class="btn btn-sm btn-danger" onclick="deletePlan('${plan.planId}')">删除</button>
      </div>
    </div>`;
}
