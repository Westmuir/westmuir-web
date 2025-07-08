let openNavButton;

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('#site-nav');
  const openNavButton = document.getElementById('open-nav-button');

  const closeSidebar = () => {
    navbar.classList.remove('show');
    openNavButton.setAttribute('aria-expanded', 'false');
    navbar.setAttribute('inert', '');
  };

  const updateNavbar = e => {
    // if matches then implies isMobile,  so set to be inert
    e?.matches ? navbar.setAttribute('inert', '') : navbar.removeAttribute('inert');
  };

  window.matchMedia('(width < 700px)').addEventListener('change', e => updateNavbar(e));

  openNavButton?.addEventListener('click', () => {
    navbar.classList.add('show');
    openNavButton.setAttribute('aria-expanded', 'true');
    navbar.removeAttribute('inert');
  });

  document.getElementById('close-nav-button')?.addEventListener('click', () => {
    closeSidebar();
  });

  document.getElementById('overlay')?.addEventListener('click', e => {
    closeSidebar();
  });

  updateNavbar();
});
