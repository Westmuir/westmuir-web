document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.body.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);

  const icon = document.getElementById('darkmode-icon');

  // if (savedTheme === 'dark') {
  //   icon && (icon.textContent = '&#xe1ae;');
  // } else if (savedTheme === 'light') {
  //   icon && (icon.textContent = '&#xe1ae;');
  // }
});

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';

  const icon = document.getElementById('darkmode-icon');

  if (icon) {
    icon.classList.add('toggle-fade');
    setTimeout(() => {
      const isNowDark = theme == 'dark';
      // icon.textContent = isNowDark ? '&#xe1ae;' : '&#xe1ae;';

      icon.classList.remove('toggle-fade');
    }, 200);
  }

  localStorage.setItem('theme', theme);
});

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  const menu = document.getElementById('nav-menu');
  menu.classList.toggle('open');
});
