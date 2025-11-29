// token.js  – One-time token library (by Taithai)

// ทั้งหมดทำงานใน IIFE เพื่อลดของเลอะบน global
(function (window) {
  const STORAGE_KEY = "tokensStore";

  function getStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function generate() {
    return Math.random().toString(36).slice(2, 10); // ตัวอย่าง: "k3f9ab1z"
  }

  // -----------------------------
  // 1) สร้างโทเค็นใหม่ + redirect
  // -----------------------------
  function create(options) {
    const opts = options || {};
    const target = opts.target || "index.html";
    const extraQuery = opts.extraQuery || "";

    const store = getStore();
    const token = generate();

    store[token] = { used: false, createdAt: Date.now() };
    saveStore(store);

    let url = target + "?token=" + encodeURIComponent(token);
    if (extraQuery) url += "&" + extraQuery;

    window.location.href = url;
  }

  // ----------------------------------------
  // 2) guard แบบเก่า (ยังเก็บไว้เผื่อมีคนใช้)
  //    อันนี้จะ redirect กลับ tokenPage ถ้าไม่ผ่าน
  // ----------------------------------------
  function guard(options) {
    const opts = options || {};
    const tokenPage = opts.tokenPage || "token.html";
    const cleanUrl = opts.cleanUrl !== false;
    const onSuccess = opts.onSuccess || function () {};
    const onFail = opts.onFail || function () {};

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      onFail("missing_token");
      return (window.location.href = tokenPage);
    }

    const store = getStore();
    const info = store[token];

    if (!info) {
      onFail("not_found");
      return (window.location.href = tokenPage);
    }

    if (info.used) {
      onFail("already_used");
      return (window.location.href = tokenPage);
    }

    info.used = true;
    info.usedAt = Date.now();
    saveStore(store);

    if (cleanUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    onSuccess({ token, info });
  }

  // ------------------------------------------------
  // 3) useOnce: เวอร์ชันที่คุณต้องการแบบเป๊ะ ๆ
  //    - ไม่ redirect เอง
  //    - ไม่สร้าง token ใหม่เอง
  //    - ใช้สำหรับหน้า home / secure
  // ------------------------------------------------
  function useOnce(options) {
    const opts = options || {};
    const cleanUrl = opts.cleanUrl !== false;
    const onFirstUse = opts.onFirstUse || function () {};
    const onAlreadyUsed = opts.onAlreadyUsed || function () {};
    const onInvalid = opts.onInvalid || function () {};

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      onInvalid("missing_token");
      return;
    }

    const store = getStore();
    const info = store[token];

    if (!info) {
      onInvalid("not_found");
      return;
    }

    if (info.used) {
      onAlreadyUsed({ token, info });
      return;
    }

    // ✅ ใช้ครั้งแรก
    info.used = true;
    info.usedAt = Date.now();
    store[token] = info;
    saveStore(store);

    if (cleanUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    onFirstUse({ token, info });
  }

  // export
  window.Token = {
    create,   // เอาไว้ใช้ในหน้า Gen / NFC
    guard,    // เวอร์ชันเดิม (มี redirect)
    useOnce,  // เวอร์ชันใหม่ ใช้ครั้งเดียวตามที่คุณต้องการ
  };
})(window);
