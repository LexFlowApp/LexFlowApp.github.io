const MARK = 'data:image/png;base64,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';
// 下载地址就绪后填入此处（把 .zip 或 .dmg 的完整网址粘在引号内），
// 首页与安装说明页的下载按钮会立即启用；留空时保持「即将开放」提示。
const DOWNLOAD_URL = 'https://pub-b70f382c31d1442c96fcd91640b5ec1f.r2.dev/LexFlow-0.4.0-arm64.dmg';

// 判断访问设备：只有 Mac 提供下载，其余设备引导到电脑上打开。
const DEVICE = (function () {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  return 'other';
})();

const dialog = document.querySelector('#download-dialog');
const mobileDialog = document.querySelector('#mobile-dialog');
function closeOnBackdrop(box) {
  if (!box) return;
  box.addEventListener('click', event => {
    if (event.target !== box) return;
    const rect = box.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) box.close();
  });
}
closeOnBackdrop(dialog);
closeOnBackdrop(mobileDialog);

function startDownload() {
  const link = document.createElement('a');
  link.href = DOWNLOAD_URL;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => {
  if (!DOWNLOAD_URL) { if (dialog) dialog.showModal(); return; }
  if (DEVICE === 'mac') { startDownload(); return; }
  if (mobileDialog) mobileDialog.showModal();
}));

document.querySelectorAll('.dialog-close,.dialog-confirm').forEach(button => button.addEventListener('click', () => {
  const box = button.closest('dialog');
  if (box) box.close();
}));

const copyButton = document.querySelector('[data-copy-url]');
if (copyButton) copyButton.addEventListener('click', () => {
  const url = location.origin + location.pathname.replace(/install\.html$/, '');
  const done = () => copyButton.textContent = '已复制，发到电脑上打开';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, done);
  } else {
    const field = document.createElement('textarea');
    field.value = url;
    document.body.appendChild(field);
    field.select();
    try { document.execCommand('copy'); } catch (error) { /* 复制失败时按钮文字保持不变 */ }
    field.remove();
    done();
  }
});

const panel = document.querySelector('#demo-panel');
const iconPaths = {
 plus:'M12 5v14M5 12h14', folder:'M3 7V5h6l2 2h10v13H3Z', workflow:'M4 3h6v6H4zM14 15h6v6h-6zM7 9v8h7M17 15V7h-7', tool:'M14 4a6 6 0 0 0-7 8l-5 5 3 3 5-5a6 6 0 0 0 8-7l-4 4-3-3 4-4Z', search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', sliders:'M3 6h18M3 12h18M3 18h18M8 4v4M16 10v4M10 16v4',folderPlus:'M3 7V5h6l2 2h10v13H3ZM15 10v7m-3-3h6',settings:'M9 3h6l1 4 4 1v7l-4 1-1 4H9l-1-4-4-1V8l4-1ZM15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',file:'M5 3h14v18H5ZM8 8h8M8 12h8M8 16h5',back:'M20 12H4m6-6-6 6 6 6',filter:'M3 4h18l-7 8v7l-4 2V12Z',check:'M4 4h16v16H4ZM7 12l3 3 7-7',clip:'M8 12v5a4 4 0 0 0 8 0V7a3 3 0 0 0-6 0v9a1 1 0 0 0 2 0V8',shield:'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6ZM12 7v6m0 3v1'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name] || iconPaths.file}"/></svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const fileRows = (archive) => (archive ? [['合同审阅项目','3 项','文件夹'],['项目背景','2026/9/18 14:30','Markdown'],['审阅意见','2026/9/18 15:20','Markdown']] : [['AGENT.md','2026/9/18 14:13','全局规则'],['合同审阅工作流','2026/9/18 15:20','工作流'],['文书表达偏好','2026/9/18 16:00','长期记忆']]).map(([name,date,type]) => `<button class="lf-file-row" data-file="${name}"><span>${icon(type==='文件夹'?'folder':'file')}${name}</span><span>${date}</span><span>${type}</span></button>`).join('');
const library = archive => `<div class="lf-library"><button class="lf-back" data-back aria-label="返回对话">${icon('back')}</button><header><h3>${archive?'档案室':'工作流'}</h3><span>› &nbsp; LexFlow Knowledge Base</span></header><div class="lf-library-tools"><p>${archive?'保存资料，积累工作成果':'可复用的工作方法与长期记忆'}</p><div aria-label="列表工具示意">${icon('check')}${icon('search')}${icon('filter')}${icon('plus')}</div></div><div class="lf-table-head"><span>名称</span><span>修改日期</span><span>类型</span></div><div>${fileRows(archive)}</div><div class="lf-library-footer"><span>3 项</span><span>刷新 &nbsp; 旧数据</span></div></div>`;
const views = {
 conversation: `<div class="lf-conversation"><h3><img src="${MARK}" width="29" height="29" alt="">Everything is Workflow</h3><div class="lf-composer-group"><div class="lf-project">${icon('folder')}法律工作空间 <span>⌄</span></div><div class="lf-composer"><p>描述你想要构建的内容，/ 调用指令，@ 文件或对话</p><div class="lf-composer-toolbar"><span class="lf-circle">${icon('plus')}</span><span class="lf-circle">${icon('clip')}</span><span class="lf-permission">${icon('shield')}完全权限⌄</span><span class="lf-model">DeepSeek V4.1 Flash &nbsp;⌄</span><span class="lf-send">↑</span></div></div></div></div>`,
 workflow: library(false),
 archive: library(true),
 workbench: `<div class="lf-empty"><strong>工作台</strong><p>选择文件后，在这里查看或编辑。</p></div>`
};
const tabs = [...document.querySelectorAll('[data-view]')];
function activateTab(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
  panel.innerHTML = views[tab.dataset.view];
  panel.setAttribute('aria-labelledby', tab.id);

  panel.scrollTop = 0;
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); activateTab(tabs[next]); }
  });
});
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(element => { element.classList.add('will-reveal'); observer.observe(element); });
}

activateTab(tabs[0]);
const appWindow = document.querySelector('.faithful-app');
const collapseButton = document.querySelector('.collapse-sidebar');
const expandButton = document.querySelector('.expand-sidebar');
expandButton.innerHTML = collapseButton.innerHTML;
function toggleSidebar(collapsed) {
  appWindow.classList.toggle('sidebar-collapsed', collapsed);
  expandButton.hidden = !collapsed;
  (collapsed ? expandButton : collapseButton).focus({ preventScroll: true });
}
collapseButton.addEventListener('click', () => toggleSidebar(true));
expandButton.addEventListener('click', () => toggleSidebar(false));
const narrowDemo = matchMedia('(max-width: 620px)');
function syncDemoNavigation() {
  document.querySelector('.app-nav').setAttribute('aria-orientation', narrowDemo.matches ? 'horizontal' : 'vertical');
  if (narrowDemo.matches) {
    appWindow.classList.remove('sidebar-collapsed');
    expandButton.hidden = true;
  }
}
narrowDemo.addEventListener('change', syncDemoNavigation);
syncDemoNavigation();
panel.addEventListener('click', event => {
  const back = event.target.closest('[data-back]');
  if (back) activateTab(tabs[back.dataset.back === 'archive' ? 2 : 0]);
  const row = event.target.closest('[data-file]');
  if (row) { panel.querySelectorAll('[data-file]').forEach(item => item.classList.toggle('selected', item === row)); }
});
function openDemoFile(event) {
  const row = event.target.closest('[data-file]');
  if (!row) return;
  const title = row.dataset.file;
  if (title === '合同审阅项目') {
    panel.innerHTML = library(true).replace('<h3>档案室</h3>', '<h3>合同审阅项目</h3>').replace(/<button class="lf-file-row" data-file="合同审阅项目">.*?<\/button>/, '').replace('3 项</span>', '2 项</span>');
    panel.querySelector('[data-back]').dataset.back = 'archive';
    panel.querySelector('[data-back]').setAttribute('aria-label', '返回档案室');
    return;
  }
  activateTab(tabs[3]);
  panel.innerHTML = `<div class="lf-editor"><header><h3></h3><span>实时预览 ⌄</span><button data-close-editor aria-label="退出演示工作台">×</button></header><div class="lf-editor-tools" aria-label="编辑工具栏示意"><span>↶</span><span>↷</span><span>标题⌄</span><b>B</b><i>I</i><s>S</s><span>▱</span><span>•</span><span>1.</span><span>☑</span><span>❞</span><span class="lf-tools-right">＋ &nbsp;⌕ &nbsp;▣</span></div><article><h4>一、工作目标</h4><p>结合项目背景，梳理需要优先确认的事项。</p><h4>二、工作步骤</h4><p>明确审阅范围，核对相关材料，整理分析意见。</p><blockquote>将需要进一步确认的问题单独记录。</blockquote></article><footer><span>示例文稿</span></footer></div>`;
  panel.querySelector('h3').textContent = title;
}
panel.addEventListener('dblclick', openDemoFile);
panel.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.closest('[data-file]')) {
    event.preventDefault(); openDemoFile(event);
  }
});
panel.addEventListener('click', event => { if (event.target.closest('[data-close-editor]')) activateTab(tabs[3]); });
