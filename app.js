const dialog = document.querySelector('#download-dialog');
document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
document.querySelectorAll('.dialog-close,.dialog-confirm').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });

const panel = document.querySelector('#demo-panel');
const iconPaths = {
 plus:'M12 5v14M5 12h14', folder:'M3 7V5h6l2 2h10v13H3Z', workflow:'M4 3h6v6H4zM14 15h6v6h-6zM7 9v8h7M17 15V7h-7', tool:'M14 4a6 6 0 0 0-7 8l-5 5 3 3 5-5a6 6 0 0 0 8-7l-4 4-3-3 4-4Z', search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', sliders:'M3 6h18M3 12h18M3 18h18M8 4v4M16 10v4M10 16v4',folderPlus:'M3 7V5h6l2 2h10v13H3ZM15 10v7m-3-3h6',settings:'M9 3h6l1 4 4 1v7l-4 1-1 4H9l-1-4-4-1V8l4-1ZM15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',file:'M5 3h14v18H5ZM8 8h8M8 12h8M8 16h5',back:'M20 12H4m6-6-6 6 6 6',filter:'M3 4h18l-7 8v7l-4 2V12Z',check:'M4 4h16v16H4ZM7 12l3 3 7-7',clip:'M8 12v5a4 4 0 0 0 8 0V7a3 3 0 0 0-6 0v9a1 1 0 0 0 2 0V8',shield:'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6ZM12 7v6m0 3v1'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name] || iconPaths.file}"/></svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const fileRows = (archive) => (archive ? [['合同审阅项目','3 项','文件夹'],['项目背景','2026/9/18 14:30','Markdown'],['审阅意见','2026/9/18 15:20','Markdown']] : [['AGENT.md','2026/9/18 14:13','全局规则'],['合同审阅工作流','2026/9/18 15:20','工作流'],['文书表达偏好','2026/9/18 16:00','长期记忆']]).map(([name,date,type]) => `<button class="lf-file-row" data-file="${name}"><span>${icon(type==='文件夹'?'folder':'file')}${name}</span><span>${date}</span><span>${type}</span></button>`).join('');
const library = archive => `<div class="lf-library"><button class="lf-back" data-back aria-label="返回对话">${icon('back')}</button><header><h3>${archive?'档案室':'工作流'}</h3><span>› &nbsp; LexFlow Knowledge Base</span></header><div class="lf-library-tools"><p>${archive?'保存资料，积累工作成果':'可复用的工作方法与长期记忆'}</p><div aria-label="列表工具示意">${icon('check')}${icon('search')}${icon('filter')}${icon('plus')}</div></div><div class="lf-table-head"><span>名称</span><span>修改日期</span><span>类型</span></div><div>${fileRows(archive)}</div><div class="lf-library-footer"><span>3 项</span><span>刷新 &nbsp; 旧数据</span></div></div>`;
const views = {
 conversation: `<div class="lf-conversation"><h3><img src="./lexflow-mark.png" width="29" height="29" alt="">Everything is Workflow</h3><div class="lf-composer-group"><div class="lf-project">${icon('folder')}法律工作空间 <span>⌄</span></div><div class="lf-composer"><p>描述你想要构建的内容，/ 调用指令，@ 文件或对话</p><div class="lf-composer-toolbar"><span class="lf-circle">${icon('plus')}</span><span class="lf-circle">${icon('clip')}</span><span class="lf-permission">${icon('shield')}完全权限⌄</span><span class="lf-model">DeepSeek V4.1 Flash &nbsp;⌄</span><span class="lf-send">↑</span></div></div></div></div>`,
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
