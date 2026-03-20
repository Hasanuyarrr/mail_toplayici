const STORAGE_KEY = "collectedEmails";
const COLLECTING_KEY = "isCollecting";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({ [COLLECTING_KEY]: false, [STORAGE_KEY]: [] });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "EMAILS_FOUND") {
    return;
  }

  chrome.storage.local.get([COLLECTING_KEY, STORAGE_KEY], (data) => {
    if (!data[COLLECTING_KEY]) {
      sendResponse({ ok: false, reason: "paused" });
      return;
    }

    const incoming = Array.isArray(message.emails) ? message.emails : [];
    const prev = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    const set = new Set(prev.map((e) => e.toLowerCase()));
    let added = 0;
    for (const e of incoming) {
      const lower = e.toLowerCase();
      if (!set.has(lower)) {
        set.add(lower);
        prev.push(e);
        added++;
      }
    }
    chrome.storage.local.set({ [STORAGE_KEY]: prev }, () => {
      sendResponse({ ok: true, added, total: prev.length });
    });
  });

  return true;
});
