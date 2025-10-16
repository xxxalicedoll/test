(() => {
  const state = {
    posts: [],
    filtered: [],
    loaded: false,
  };

  const $app = document.getElementById('app');
  const $search = document.getElementById('search');
  const $clear = document.getElementById('clearSearch');

  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stop-color="#00704A"/>
          <stop offset="100%" stop-color="#0a8f69"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#g)"/>
      <g fill="#ffffff" fill-opacity="0.12">
        <circle cx="150" cy="150" r="110"/>
        <circle cx="1080" cy="560" r="160"/>
        <circle cx="980" cy="120" r="80"/>
      </g>
      <g fill="#ffffff">
        <text x="60" y="120" font-family="Segoe UI, Roboto, sans-serif" font-size="64" font-weight="800">STABA BLOG</text>
        <text x="60" y="190" font-family="Segoe UI, Roboto, sans-serif" font-size="34" font-weight="600">季節の新作・カスタマイズ・レビュー</text>
      </g>
    </svg>
  `);

  async function loadPosts() {
    if (state.loaded) return;
    try {
      // 1) inline JSON (for file:// 直開き対応)
      const inline = document.getElementById('posts-data');
      if (inline && inline.textContent?.trim()) {
        state.posts = JSON.parse(inline.textContent);
      } else {
        // 2) fetch JSON (HTTPサーブ時)
        const res = await fetch('posts/posts.json', { cache: 'no-store' });
        state.posts = await res.json();
      }
      // 新しい順に並べ替え
      state.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      state.loaded = true;
      state.filtered = state.posts;
    } catch (e) {
      console.error(e);
      state.posts = [];
      state.filtered = [];
    }
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(d);
    } catch { return iso; }
  }

  function navigate(hash) {
    if (location.hash !== hash) location.hash = hash;
    else route();
  }

  function route() {
    const hash = location.hash || '#/';
    const m = hash.match(/^#\/(?:post\/([a-z0-9-]+))?$/);
    if (!m) return renderList();
    const slug = m[1];
    if (!slug) return renderList();
    return renderPost(slug);
  }

  function filterPosts(q) {
    const query = (q || '').trim().toLowerCase();
    if (!query) return state.posts;
    return state.posts.filter(p => {
      const hay = [p.title, p.excerpt, ...(p.tags || [])].join(' ').toLowerCase();
      return hay.includes(query);
    });
  }

  function renderList() {
    const posts = state.filtered;
    if (!posts || posts.length === 0) {
      $app.innerHTML = '<div class="empty">該当する記事がありませんでした。</div>';
      return;
    }
    const cards = posts.map(p => `
      <article class="card" role="article">
        <a class="block" href="#/post/${p.slug}" aria-label="${p.title} を読む">
          <img class="thumb" src="${p.heroImage || PLACEHOLDER}" alt="${p.title}" loading="lazy" />
        </a>
        <div class="card-body">
          <a class="title" href="#/post/${p.slug}"><h3>${p.title}</h3></a>
          <div class="meta">${formatDate(p.date)}</div>
          <div class="tags">${(p.tags||[]).map(t => `<span class="tag">#${t}</span>`).join('')}</div>
        </div>
      </article>
    `).join('');

    $app.innerHTML = `<section class="grid" aria-label="記事一覧">${cards}</section>`;
  }

  function renderPost(slug) {
    const p = state.posts.find(x => x.slug === slug);
    if (!p) {
      $app.innerHTML = `<div class="empty">記事が見つかりませんでした。<br/><a class="back" href="#/">← 一覧へ戻る</a></div>`;
      return;
    }

    const html = `
      <a class="back" href="#/" onclick="history.back(); return false;">← 一覧へ戻る</a>
      <article class="article">
        <img class="hero" src="${p.heroImage || PLACEHOLDER}" alt="${p.title}" />
        <div class="article-body">
          <div class="meta">${formatDate(p.date)} · ${(p.tags||[]).map(t => `#${t}`).join(' ')}</div>
          <h1>${p.title}</h1>
          <p class="meta">${p.excerpt || ''}</p>
          <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0 1.25rem"/>
          <div class="content">${p.content || ''}</div>
        </div>
      </article>
    `;
    $app.innerHTML = html;
  }

  function attachEvents() {
    $search?.addEventListener('input', (e) => {
      state.filtered = filterPosts(e.target.value);
      renderList();
    });
    $clear?.addEventListener('click', () => {
      if ($search) $search.value = '';
      state.filtered = state.posts;
      renderList();
      $search?.focus();
    });
    window.addEventListener('hashchange', route);
  }

  async function init() {
    attachEvents();
    await loadPosts();
    route();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
