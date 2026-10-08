(() => {
  const recoveryId = "agentation-recovery";
  const hiddenStateKey = "agentation-session-toolbar-hidden";

  function nativeLauncher() {
    const toolbar = document.querySelector("agentation-toolbar");
    return toolbar?.shadowRoot?.querySelector(
      'button[aria-label="Start feedback mode"]',
    );
  }

  function hasVisibleNativeControl() {
    const toolbar = document.querySelector("agentation-toolbar");
    const controls = toolbar?.shadowRoot?.querySelectorAll("button") ?? [];
    return [...controls].some((control) => isVisible(control));
  }

  function isVisible(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function ensureLauncher() {
    const launcher = nativeLauncher();
    const existing = document.getElementById(recoveryId);

    if (isVisible(launcher) || hasVisibleNativeControl()) {
      existing?.remove();
      return;
    }

    if (existing) return;

    const button = document.createElement("button");
    button.id = recoveryId;
    button.type = "button";
    button.setAttribute("aria-label", "Open Agentation feedback");
    button.title = "Open Agentation feedback";
    button.innerHTML = "<span></span><span></span><span></span>";
    button.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483647;width:52px;height:52px;padding:0;border:0;border-radius:50%;background:#171717;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer";

    [...button.children].forEach((line, index) => {
      line.style.cssText = `display:block;width:${index === 1 ? 19 : 14}px;height:1.5px;background:#fff;border-radius:2px`;
    });

    button.addEventListener("click", () => {
      const target = nativeLauncher();
      if (target && isVisible(target)) {
        target.click();
        return;
      }

      // Agentation's "Hide Until Restart" control stores this session flag.
      // Clear it before reloading so the native launcher can mount again.
      sessionStorage.removeItem(hiddenStateKey);
      location.reload();
    });

    document.body.appendChild(button);
  }

  window.addEventListener("load", () => {
    ensureLauncher();
    setTimeout(ensureLauncher, 400);
    setTimeout(ensureLauncher, 1400);
  });
})();
