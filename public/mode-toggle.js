(function () {
  function getMode() {
    return localStorage.getItem("archiveMode") || "edit";
  }
  function setMode(m) {
    localStorage.setItem("archiveMode", m);
    applyMode();
  }
  function applyMode() {
    const mode = getMode();
    document.body.classList.toggle("view-mode", mode === "view");
    document.body.classList.toggle("edit-mode", mode === "edit");
    const editBtn = document.getElementById("modeEditBtn");
    const viewBtn = document.getElementById("modeViewBtn");
    if (editBtn && viewBtn) {
      editBtn.classList.toggle("mode-active", mode === "edit");
      viewBtn.classList.toggle("mode-active", mode === "view");
    }
  }
  function injectToggle() {
    if (document.getElementById("modeToggleWrap")) return;
    const style = document.createElement("style");
    style.textContent = `
      #modeToggleWrap {
        position: fixed; top: 16px; right: 16px; z-index: 200;
        display: flex; background: #fff; border: 1px solid #ddd; border-radius: 8px;
        overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); font-family: sans-serif;
      }
      #modeToggleWrap button {
        border: none; background: transparent; padding: 8px 14px; font-size: 13px; cursor: pointer; color: #333;
      }
      #modeToggleWrap button.mode-active { background: #000; color: #fff; }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement("div");
    wrap.id = "modeToggleWrap";
    wrap.innerHTML = `
      <button id="modeEditBtn">편집</button>
      <button id="modeViewBtn">보기</button>
    `;
    document.body.appendChild(wrap);

    document.getElementById("modeEditBtn").addEventListener("click", () => setMode("edit"));
    document.getElementById("modeViewBtn").addEventListener("click", () => setMode("view"));
    applyMode();
  }
  document.addEventListener("DOMContentLoaded", injectToggle);
})();
