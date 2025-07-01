document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  if (toggleButton && navMenu) {
    toggleButton.addEventListener("click", () => {
      navMenu.classList.add(open);
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !toggleButton.contains(e.target)) {
        navMenu.classList.remove("open");
      }
    });
  }
});
