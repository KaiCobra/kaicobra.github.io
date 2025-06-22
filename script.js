// 監聽 sidebar li 與滾動事件
const items = document.querySelectorAll('.sidebar li');
const detailContainer = document.querySelector('.detail-container');

// 載入並顯示某 detail
async function loadDetail(url, id) {
  // 移除舊內容
  detailContainer.innerHTML = '';
  // fetch 新內容
  const res = await fetch(url);
  const html = await res.text();
  detailContainer.innerHTML = html;
  // 顯示動畫
  const detailEl = document.getElementById(id);
  requestAnimationFrame(() => detailEl.classList.add('show'));
  // 重新綁定 modal 事件
  setupCitationModal();
  // 輪播照片
  setupGallery();
  // 若是 publications 頁，渲染論文
  if (url && url.includes('publications.html') && typeof renderPublications === 'function') {
    renderPublications();
  }
}

// 設定每個 li scrollTrigger
items.forEach(item => {
  const detailUrl = item.getAttribute('data-detail');
  const detailId = detailUrl.replace(/.*\/(.*)\.html$/, 'detail-$1');

  // 點擊可手動切換
  item.addEventListener('click', () => loadDetail(detailUrl, detailId));

  // 滾動至該項目進入視窗中段，觸發顯示
  ScrollTrigger.create({
    trigger: item,
    start: 'top center',
    onEnter: () => {
      items.forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      loadDetail(detailUrl, detailId);
    }
  });
});

// Citation Modal
function setupCitationModal() {
  const btnCit = document.getElementById('btn-citation');
  const modalCit = document.getElementById('modal-citation');
  const closeCit = modalCit ? modalCit.querySelector('.close-btn') : null;

  if (btnCit && modalCit && closeCit) {
    btnCit.onclick = () => { modalCit.style.display = 'block'; };
    closeCit.onclick = () => { modalCit.style.display = 'none'; };
    window.onclick = (e) => {
      if (e.target === modalCit) {
        modalCit.style.display = 'none';
      }
    };
  }
}
// 首次進入頁面也要綁一次
setupCitationModal();
setupGallery();

// 輪播照片功能
function setupGallery() {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;
  const images = gallery.querySelectorAll('.pfp');
  if (images.length <= 1) return;
  let idx = 0;
  images.forEach((img, i) => img.classList.toggle('active', i === 0));
  if (gallery._interval) clearInterval(gallery._interval);
  gallery._interval = setInterval(() => {
    images[idx].classList.remove('active');
    idx = (idx + 1) % images.length;
    images[idx].classList.add('active');
  }, 2000);
}

// 自動解析 BibTeX 並格式化顯示
function renderPublications() {
  const raw = document.getElementById('bibtex-input').value.trim();
  const entries = raw.split(/^@/m)
    .map(e => e.trim()).filter(e => e)
    .map(e => '@' + e);
  const out = document.getElementById('pub-output');
  out.innerHTML = '';
  entries.forEach(bib => {
    // 解析常用欄位
    const title = bib.match(/title=\{(.+?)\}/i)?.[1] || '';
    const author = bib.match(/author=\{(.+?)\}/i)?.[1] || '';
    const booktitle = bib.match(/booktitle=\{(.+?)\}/i)?.[1] || '';
    const year = bib.match(/year=\{(\d{4})\}/i)?.[1] || '';
    const url = bib.match(/url=\{(.+?)\}/i)?.[1] || '';
    // 建立項目
    const div = document.createElement('div');
    div.className = 'pub-item';
    div.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Authors:</strong> ${author}</p>
      <p><strong>Venue:</strong> ${booktitle}, ${year}</p>
      ${ url ? `<p><strong>Link:</strong> <a href="${url}" target="_blank">${url}</a></p>` : '' }
    `;
    out.append(div);
  });
}

// 初次載入時渲染
window.addEventListener('load', renderPublications);
