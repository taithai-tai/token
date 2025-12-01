  // -------------------------------------------------
  // 2) useOnce: โทเคน 1 อัน ใช้เข้าได้รอบเดียวใน browser นี้
  //    - ไม่ redirect เอง
  //    - ไม่สร้างโทเคนใหม่เอง
  //    - ถ้า refresh → แล้วแต่ onAlreadyUsed จะทำอะไร
  // -------------------------------------------------
  function useOnce(options) {
    const opts = options || {};
    const selector = opts.selector || "#app";
    const cleanUrl = opts.cleanUrl === true; // default = ไม่ลบ token ออกจาก URL

    // callback (ถ้าไม่ใส่ จะไม่มีอะไรเกิดขึ้น)
    const onFirstUse = opts.onFirstUse || null;
    const onAlreadyUsed = opts.onAlreadyUsed || null;
    const onInvalid = opts.onInvalid || null;

    // ข้อความ default ไว้ใช้กรณีที่คุณไม่ส่ง callback มา
    const defaultMessages = {
      first: "🎉 ยินดีต้อนรับ! โทเคนนี้ถูกต้อง และเพิ่งถูกใช้ครั้งแรกในอุปกรณ์นี้",
      used: "⛔ โทเคนนี้ถูกใช้ไปแล้วในอุปกรณ์นี้",
      invalid: "❌ โทเคนไม่ถูกต้อง หรือไม่เคยถูกสร้างในอุปกรณ์นี้"
    };

    // ถ้าอยาก override ข้อความ สามารถส่ง opts.messages เข้ามาได้
    const messages = Object.assign({}, defaultMessages, opts.messages || {});

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      if (onInvalid) {
        return onInvalid("missing_token");
      }
      renderMessage(messages.invalid + " (missing token)", selector);
      return;
    }

    const store = getStore();
    const info = store[token];

    if (!info) {
      if (onInvalid) {
        return onInvalid("not_found");
      }
      renderMessage(messages.invalid + " (not found)", selector);
      return;
    }

    if (info.used) {
      if (onAlreadyUsed) {
        return onAlreadyUsed({ token, info });
      }
      renderMessage(messages.used, selector);
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

    // ถ้ามี onFirstUse → ให้ callback เป็นคนตัดสินใจว่าจะทำอะไร
    if (onFirstUse) {
      return onFirstUse({ token, info });
    }

    // ถ้าไม่มี onFirstUse → ค่อยใช้ข้อความ default
    renderMessage(messages.first, selector);
  }
