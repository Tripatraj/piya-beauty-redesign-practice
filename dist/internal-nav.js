(() => {
  const shopNav = document.querySelector(".shop-nav");
  const trigger = document.querySelector(".shop-trigger");
  const menu = document.querySelector("#shop-mega-menu");

  if (!shopNav || !trigger || !menu) return;

  const setOpen = (open) => {
    shopNav.dataset.open = String(open);
    trigger.setAttribute("aria-expanded", String(open));
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(trigger.getAttribute("aria-expanded") !== "true");
  });

  let closeTimer;
  const keepOpen = () => {
    clearTimeout(closeTimer);
    setOpen(true);
  };
  const closeAfterLeave = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!shopNav.matches(":hover") && !menu.matches(":hover")) setOpen(false);
    }, 180);
  };

  shopNav.addEventListener("mouseenter", keepOpen);
  shopNav.addEventListener("mouseleave", closeAfterLeave);
  menu.addEventListener("mouseenter", keepOpen);
  menu.addEventListener("mouseleave", closeAfterLeave);
  document.addEventListener("click", (event) => {
    if (!shopNav.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      trigger.focus();
    }
  });

  const categoryLinks = [...menu.querySelectorAll(".mega-links > a")];
  const feature = menu.querySelector(".mega-feature");
  const featureImage = feature?.querySelector("img");
  const featureLabel = feature?.querySelector("span");
  const featureTitle = feature?.querySelector("strong");

  const showFeature = (link) => {
    categoryLinks.forEach((item) => item.classList.toggle("is-active", item === link));
    if (!feature || !featureImage || !featureLabel || !featureTitle) return;
    feature.href = link.dataset.featureHref;
    featureLabel.textContent = link.dataset.featureLabel;
    featureTitle.textContent = `${link.dataset.featureTitle} ↗`;
    featureImage.src = link.dataset.featureImage;
    featureImage.alt = link.dataset.featureAlt;
  };

  categoryLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => showFeature(link));
    link.addEventListener("focus", () => showFeature(link));
  });
})();
