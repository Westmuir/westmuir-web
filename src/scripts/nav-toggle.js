let openNavButton;

document.addEventListener('DOMContentLoaded', () => {
  // const toggleButton = document.getElementById('nav-toggle');
  // const navMenu = document.getElementById('nav-menu');

  // if (toggleButton && navMenu) {
  //   toggleButton.addEventListener('click', () => {
  //     navMenu.classList.add(open);
  //   });

  //   document.addEventListener('click', e => {
  //     if (!navMenu.contains(e.target) && !toggleButton.contains(e.target)) {
  //       navMenu.classList.remove('open');
  //     }
  //   });
  // }

  const media = window.matchMedia('(width < 700px)');

  media.addEventListener('change', e => updateNavbar(e));

  openNavButton = document.getElementById('open-nav-button');

  if (openNavButton) {
    openNavButton.addEventListener('click', () => {
      openSidebar();
    });
  }

  const closeNavButton = document.getElementById('close-nav-button');

  if (closeNavButton) {
    closeNavButton.addEventListener('click', () => {
      closeSidebar();
    });
  }

  const overlay = document.getElementById('overlay');

  if (overlay) {
    overlay.addEventListener('click', e => {
      closeSidebar();
    });
  }

  updateNavbar(media);
});

function updateNavbar(e) {
  const isMobile = e.matches;
  if (isMobile) {
    navbar.setAttribute('inert', '');
  } else {
    // desktop device
    navbar.removeAttribute('inert');
  }
}

function openSidebar() {
  navbar.classList.add('show');
  openNavButton.setAttribute('aria-expanded', 'true');
  navbar.removeAttribute('inert');
}

function closeSidebar() {
  navbar.classList.remove('show');
  openNavButton.setAttribute('aria-expanded', 'false');
  navbar.setAttribute('inert', '');
}
