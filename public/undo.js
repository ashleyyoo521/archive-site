(function () {
  const KEY_STACK = "archiveHistoryStack";
  const KEY_INDEX = "archiveHistoryIndex";

  function getStack() {
    try { return JSON.parse(sessionStorage.getItem(KEY_STACK) || "[]"); } catch { return []; }
  }
  function setStack(s) { sessionStorage.setItem(KEY_STACK, JSON.stringify(s)); }
  function getIndex() { return parseInt(sessionStorage.getItem(KEY_INDEX) || "-1", 10); }
  function setIndex(i) { sessionStorage.setItem(KEY_INDEX, String(i)); }

  window.pushHistory = function (action) {
    let stack = getStack();
    let idx = getIndex();
    stack = stack.slice(0, idx + 1);
    stack.push(action);
    idx = stack.length - 1;
    setStack(stack);
    setIndex(idx);
  };

  async function callApi(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function applyAction(action, direction) {
    if (action.type === "text") {
      const value = direction === "undo" ? action.oldValue : action.newValue;
      await callApi("/api/update", { id: action.id, type: "text", field: action.field, value });
    } else if (action.type === "addTag") {
      if (direction === "undo") await callApi("/api/update", { id: action.id, type: "removeTag", tag: action.tag });
      else await callApi("/api/update", { id: action.id, type: "addTag", tag: action.tag });
    } else if (action.type === "removeTag") {
      if (direction === "undo") await callApi("/api/update", { id: action.id, type: "addTag", tag: action.tag });
      else await callApi("/api/update", { id: action.id, type: "removeTag", tag: action.tag });
    } else if (action.type === "deleteCard") {
      if (direction === "undo") await callApi("/api/restore", { id: action.id });
      else await callApi("/api/delete", { id: action.id });
    } else if (action.type === "createCard") {
      if (direction === "undo") await callApi("/api/delete", { id: action.id });
      else await callApi("/api/restore", { id: action.id });
    }
  }

  function flashMsg(text) {
    let el = document.getElementById("historyToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "historyToast";
      el.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;z-index:300;font-family:sans-serif;opacity:0;transition:opacity .2s;";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; }, 1500);
  }

  async function undo() {
    const idx = getIndex();
    const stack = getStack();
    if (idx < 0) { flashMsg("더 이상 되돌릴 작업이 없어요"); return; }
    await applyAction(stack[idx], "undo");
    setIndex(idx - 1);
    flashMsg("되돌렸어요");
    setTimeout(() => location.reload(), 300);
  }

  async function redo() {
    const idx = getIndex();
    const stack = getStack();
    if (idx >= stack.length - 1) { flashMsg("다시 실행할 작업이 없어요"); return; }
    await applyAction(stack[idx + 1], "redo");
    setIndex(idx + 1);
    flashMsg("다시 실행했어요");
    setTimeout(() => location.reload(), 300);
  }

  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    const isEditableFocus = tag === "input" || tag === "textarea";
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key.toLowerCase() !== "z") return;
    if (isEditableFocus) return;
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
  });
})();
