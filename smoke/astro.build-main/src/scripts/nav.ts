const nav = document.querySelector("nav.main") as HTMLElement;

window.addEventListener("DOMContentLoaded", () => {
  let isStuck = false;
  function updateStuck() {
    if (isStuck && window.scrollY <= 65) {
      isStuck = false;
      nav.removeAttribute("stuck");
    }
    if (!isStuck && window.scrollY > 65) {
      isStuck = true;
      nav.setAttribute("stuck", "");
    }
  }

  updateStuck();
  window.addEventListener("scroll", updateStuck);
});
