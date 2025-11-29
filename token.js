// Token.js by Taithai © 2025
(function (window) {
  const STORAGE_KEY = "tokensStore";

  function getStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function generate() {
    return Math.random().toString(36).slice(2, 10);
  }

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

  window.Token = { create, guard };
})(window);
