/**
 * utils.js — 通用工具函数
 *
 * 包含日期、ID 生成、DOM 操作、Modal 控制等共享逻辑。
 */

/* ── DOM 快捷选择器 ── */
const $ = id => document.getElementById(id);

/* ── 生成 UUID（简化版） ── */
const uuid = () => Math.random().toString(36).slice(2, 10);

/**
 * 返回今日日期字符串，格式：YYYY-MM-DD
 * @returns {string}
 */
function today() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * HTML 转义，防止 XSS。
 * @param {*} s
 * @returns {string}
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── Modal 控制 ── */
function openModal(id)  { $(id).classList.add('open');    }
function closeModal(id) { $(id).classList.remove('open'); }

// 点击遮罩层关闭 Modal
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

/* ── 顶部日期显示 ── */
function setTodayLabel() {
  const d = new Date();
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  $('today-date').textContent =
    `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日  星期${days[d.getDay()]}`;
}

/* ── 导航切换 ── */
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      $('page-' + el.dataset.page).classList.add('active');
      render();
    });
  });
}
