import { createClient } from "honox/client";

createClient();

document.addEventListener("click", async (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-copy]") : null;

  if (!target) {
    return;
  }

  const value = target.dataset.copy;

  if (!value) {
    return;
  }

  const label = target.querySelector<HTMLElement>("[data-copy-label]");
  const previous = label?.textContent;

  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard API is unavailable");
    }

    await navigator.clipboard.writeText(value);
  } catch {
    if (label) {
      label.textContent = "复制失败";
      window.setTimeout(() => {
        label.textContent = previous ?? "";
      }, 1200);
    }

    return;
  }

  target.dataset.copied = "true";

  if (label && previous) {
    label.textContent = "已复制";
    window.setTimeout(() => {
      label.textContent = previous;
      delete target.dataset.copied;
    }, 1200);
  }
});
