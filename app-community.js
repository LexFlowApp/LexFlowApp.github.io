// 渲染工作流社区列表：读取 workflow-list.js 中的 WORKFLOWS 数组并生成卡片。
// 数据与渲染分离，站长上架新工作流时只改 workflow-list.js，不动本文件。
(function () {
  var list = document.querySelector('#workflow-list');
  if (!list || typeof WORKFLOWS === 'undefined') return;
  if (!WORKFLOWS.length) {
    list.innerHTML = '<p class="community-empty">首个工作流即将上架。</p>';
    return;
  }
  var parts = [];
  for (var i = 0; i < WORKFLOWS.length; i += 1) {
    var item = WORKFLOWS[i];
    var safeName = String(item.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeDesc = String(item.desc).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeFile = String(item.file).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    var safeDate = String(item.date).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    parts.push('<div class="workflow-card">'
      + '<div class="workflow-info"><h3>' + safeName + '</h3>'
      + '<p>' + safeDesc + '</p>'
      + '<span class="workflow-meta">' + safeDate + '</span></div>'
      + '<a class="button workflow-download" href="./workflows/' + safeFile + '" download>'
      + '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/></svg>下载</a>'
      + '</div>');
  }
  list.innerHTML = parts.join('');
})();
