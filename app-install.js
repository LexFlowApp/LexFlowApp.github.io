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

// 点击下载按钮先弹窗，让用户在下载前看到系统要求与安装说明；
// 非 Mac 设备改为提示到电脑上打开。
document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => {
  if (DEVICE !== 'mac') { if (mobileDialog) mobileDialog.showModal(); return; }
  if (dialog) dialog.showModal();
}));

// 弹窗内的下载按钮才真正发起下载。
document.querySelectorAll('[data-start-download]').forEach(button => button.addEventListener('click', () => {
  if (!DOWNLOAD_URL) return;
  startDownload();
  if (dialog) dialog.close();
}));

// 下载地址就绪后去掉「即将开放」提示，并让下载按钮可用。
(function () {
  if (!DOWNLOAD_URL) return;
  const available = document.querySelector('.dialog-availability');
  if (available) available.remove();
  const lead = document.querySelector('.dialog-lead');
  if (lead) lead.textContent = lead.textContent.replace('下载后按安装说明完成首次打开。', '下载后按安装说明完成首次打开，只有首次需要额外操作。');
})();

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
