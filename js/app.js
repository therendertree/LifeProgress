/**
 * app.js — 应用入口
 *
 * 所有 JS 模块加载完成后，执行初始化：
 *  1. 设置顶部日期显示
 *  2. 绑定导航切换事件
 *  3. 执行首次渲染
 */

(function init() {
  setTodayLabel();
  initNavigation();
  render();
})();
