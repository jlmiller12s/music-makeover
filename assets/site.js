(function () {
  document.addEventListener('DOMContentLoaded', () => {
    wireNavigation();
    markCurrentNav();
  });

  function wireNavigation() {
    document.querySelectorAll('.hamburger').forEach((button) => {
      if (button.dataset.navReady === 'true') return;
      const header = button.closest('.header');
      const nav = header && header.querySelector('.nav');
      if (!nav) return;

      button.dataset.navReady = 'true';
      button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        setMenuState(button, nav, !isOpen);
      });

      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuState(button, nav, false));
      });
    });
  }

  function setMenuState(button, nav, isOpen) {
    button.setAttribute('aria-expanded', String(isOpen));
    button.classList.toggle('active', isOpen);
    nav.classList.toggle('active', isOpen);
  }

  function markCurrentNav() {
    const currentPath = normalizePath(window.location.pathname);
    document.querySelectorAll('.nav a').forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);
      const isCurrent = linkPath === currentPath || (currentPath === '/' && linkPath === '/index.html');
      if (isCurrent && !link.hash) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-current');
      }
    });
  }

  function normalizePath(path) {
    if (!path || path === '/') return '/index.html';
    return path.endsWith('/') ? `${path}index.html` : path;
  }
}());
