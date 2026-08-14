const NAV_ITEMS = [
  { label: "Home", page: "home" },
  { label: "Categories", page: "categories" },
  { label: "Browse Tools", page: "tools" },
  { label: "Connect", page: "connect" },
];

// TODO before shipping: swap the bare domains below for your real profile URLs
const SOCIAL_ICONS = `
  <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.21c0 4.51 2.87 8.33 6.84 9.68.5.1.68-.22.68-.5 0-.24-.01-.89-.01-1.75-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.5A10.02 10.02 0 0 0 22 12.21C22 6.58 17.52 2 12 2Z"/></svg>
  </a>
  <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" aria-label="Discord">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 5.33A17.7 17.7 0 0 0 14.9 4a12.4 12.4 0 0 0-.56 1.15 16.4 16.4 0 0 0-4.68 0A12.4 12.4 0 0 0 9.1 4a17.7 17.7 0 0 0-4.37 1.33C2.1 9.36 1.4 13.28 1.74 17.15a17.9 17.9 0 0 0 5.43 2.73c.44-.6.83-1.24 1.16-1.92-.64-.24-1.25-.53-1.83-.88.15-.11.3-.23.45-.35a12.6 12.6 0 0 0 10.1 0c.15.12.3.24.45.35-.58.35-1.19.64-1.83.88.33.68.72 1.32 1.16 1.92a17.9 17.9 0 0 0 5.43-2.73c.4-4.5-.72-8.38-3.02-11.82ZM8.68 14.8c-1.01 0-1.83-.93-1.83-2.07 0-1.14.8-2.07 1.83-2.07s1.85.94 1.83 2.07c0 1.14-.8 2.07-1.83 2.07Zm6.65 0c-1.01 0-1.83-.93-1.83-2.07 0-1.14.8-2.07 1.83-2.07s1.85.94 1.83 2.07c0 1.14-.8 2.07-1.83 2.07Z"/></svg>
  </a>
  <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.6 10.6 20.4 3h-2.2l-5.9 6.6L7.7 3H2.5l7.1 10.1L2.5 21h2.2l6.2-7 5 7h5.2l-7.5-10.4Zm-2.2 2.5-.7-1L5 4.6h2.3l4.6 6.5.7 1 6 8.4h-2.3l-4.9-6.9Z"/></svg>
  </a>
  <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="8.5" width="3.4" height="11.5"/><circle cx="4.7" cy="4.2" r="2.1"/><path d="M10 8.5h3.3v1.7c.5-.9 1.7-2 3.5-2 3.7 0 4.4 2.4 4.4 5.6v6.2h-3.4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9v5.6H10V8.5Z"/></svg>
  </a>
`;

function renderHeader(activePage) {
  const navHtml = NAV_ITEMS.map(
    (item) =>
      `<a href="#${item.page}" data-page="${item.page}" ${item.page === activePage ? 'aria-current="page"' : ""}>${item.label}</a>`,
  ).join("");

  return `
    <header class="site-header">
      <a href="#" data-page="home" class="brand">
        <img
          src="assets/logo.png"
          alt="Developer Dashboard logo"
          width="44"
          height="44"
          onerror="this.outerHTML='<span class=&quot;brand-logo-fallback&quot;>DD</span>'"
        />
        <span class="brand-text"><span>Developer</span><span>Dashboard</span></span>
      </a>
      <nav class="site-nav" data-nav aria-label="Primary">${navHtml}</nav>
      <div class="social-links">${SOCIAL_ICONS}</div>
    </header>
  `;
}

if (footerMount) {
  footerMount.innerHTML = `
    <footer class="site-footer">
      <div class="footer-content">
        <p class="footer-copyright">
          © 2026 Developer Dashboard. All rights reserved.
        </p>

        <p class="footer-disclaimer">
          An independent directory of AI &amp; developer tools. Product names,
          logos, and trademarks belong to their respective owners. No
          affiliation or endorsement is implied.
        </p>
      </div>
    </footer>
  `;
}

function mountLayout(activePage) {
  const headerMount = document.getElementById("site-header-mount");
  const footerMount = document.getElementById("site-footer-mount");
  if (headerMount) headerMount.outerHTML = renderHeader(activePage);
  if (footerMount) footerMount.outerHTML = renderFooter();
}
