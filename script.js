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

// sidebar 點擊切換 detail
items.forEach(item => {
  const detailUrl = item.getAttribute('data-detail');
  const detailId = detailUrl.replace(/.*\/(.*)\.html$/, 'detail-$1');
  item.addEventListener('click', () => {
    items.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    loadDetail(detailUrl, detailId);
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
      <h3><a href="/details/pub_${title.split(":")[0].toLowerCase().replace(/\s+/g, "_")}.html">${title}</a></h3>
      <p><strong>Authors:</strong> ${author}</p>
      <p><strong>Venue:</strong> ${booktitle}, ${year}</p>
      ${ url ? `<p><strong>Link:</strong> <a href="${url}" target="_blank">${url}</a></p>` : '' }
    `;
    out.append(div);
  });

  // 攔截論文標題 <a> 點擊，觸發側邊欄內容切換
  out.querySelectorAll('.pub-item h3 a').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      // 取得要載入的 detail 檔名
      const href = a.getAttribute('href');
      // 在 sidebar 找到對應 li
      const sidebarLis = document.querySelectorAll('.sidebar li');
      let matchedLi = null;
      sidebarLis.forEach(li => {
        if (li.getAttribute('data-detail') && href.endsWith(li.getAttribute('data-detail'))) {
          matchedLi = li;
        }
      });
      if (matchedLi) {
        matchedLi.click(); // 會自動觸發 active 樣式、內容載入、bar 動畫
      } else {
        // 若 sidebar 沒有，直接載入
        loadDetail(href, 'detail-' + href.replace(/.*\/([^./]+)\.html$/, '$1'));
      }
    });
  });
}

// 初次載入時自動顯示 About Me
window.addEventListener('DOMContentLoaded', () => {
  const firstItem = document.querySelector('.sidebar li');
  if (firstItem) {
    firstItem.classList.add('active');
    firstItem.click();
    // 讓 bar 動畫也正確定位
    setTimeout(() => {
      const sidebarUl = document.querySelector('.sidebar ul');
      const ink = document.querySelector('.sidebar-ink');
      const hoverInk = document.querySelector('.sidebar-hover-ink');
      if (sidebarUl && ink && firstItem) {
        const rect = firstItem.getBoundingClientRect();
        const parentRect = sidebarUl.getBoundingClientRect();
        ink.style.left = (rect.left - parentRect.left) + 'px';
        ink.style.width = rect.width + 'px';
        ink.style.opacity = 1;
        hoverInk.style.left = (rect.left - parentRect.left) + 'px';
        hoverInk.style.width = rect.width + 'px';
        hoverInk.style.opacity = 0;
      }
    }, 50);
  }
});

// --- sidebar 動態 bar 動畫 ---
const sidebarUl = document.querySelector('.sidebar ul');
if (sidebarUl) {
  // 插入兩層 bar
  const ink = document.createElement('div');
  ink.className = 'sidebar-ink';
  sidebarUl.appendChild(ink);
  const hoverInk = document.createElement('div');
  hoverInk.className = 'sidebar-hover-ink';
  sidebarUl.appendChild(hoverInk);

  // bar 動畫移動 function
  function moveBarToLi(bar, li, visible = true) {
    if (!li) return;
    const rect = li.getBoundingClientRect();
    const parentRect = sidebarUl.getBoundingClientRect();
    bar.style.left = (rect.left - parentRect.left) + 'px';
    bar.style.width = rect.width + 'px';
    bar.style.opacity = visible ? 1 : 0;
  }

  // 點擊切換 active
  items.forEach(item => {
    item.addEventListener('click', () => {
      moveBarToLi(ink, item, true);
    });
    // hover 動畫
    item.addEventListener('mouseenter', () => moveBarToLi(hoverInk, item, true));
    item.addEventListener('mouseleave', () => hoverInk.style.opacity = 0);
  });

  // 初始定位到 active/第一個
  const firstActive = document.querySelector('.sidebar li.active') || items[0];
  if (firstActive) {
    moveBarToLi(ink, firstActive, true);
  }
}