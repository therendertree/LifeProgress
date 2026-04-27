/**
 * storage.js — 数据持久化模块
 *
 * 负责所有 localStorage 的读写操作。
 * 数据结构：{ plans: Plan[], events: Event[] }
 *
 * Plan  结构参见 Functional Spec 3.1.2
 * Event 结构参见 Functional Spec 3.5.1
 */

const STORAGE_KEY = 'lifeProgress';

/**
 * 从 localStorage 读取全量数据。
 * 若不存在或解析失败，返回空数据结构。
 * @returns {{ plans: object[], events: object[] }}
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { plans: [], events: [] };
  } catch {
    return { plans: [], events: [] };
  }
}

/**
 * 将全量数据写入 localStorage。
 * @param {{ plans: object[], events: object[] }} data
 */
function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
