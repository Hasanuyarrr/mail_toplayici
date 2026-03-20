const EMAIL_RE = /\b[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}\b/g;

function extractFromText(text) {
  if (!text) return [];
  const matches = text.match(EMAIL_RE);
  return matches || [];
}

function extractFromMailto() {
  const out = [];
  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    try {
      const raw = a.getAttribute("href") || "";
      const addr = decodeURIComponent(raw.replace(/^mailto:/i, "").split("?")[0].trim());
      if (addr) out.push(addr);
    } catch (_) {
      /* ignore */
    }
  });
  return out;
}

function scanPage() {
  const fromHtml = extractFromText(document.documentElement ? document.documentElement.innerHTML : "");
  const fromText = extractFromText(document.body ? document.body.innerText : "");
  const fromMailto = extractFromMailto();
  const set = new Set();
  for (const e of [...fromHtml, ...fromText, ...fromMailto]) {
    set.add(e.trim());
  }
  return [...set];
}

let debounceTimer = null;

function sendIfCollecting() {
  chrome.storage.local.get("isCollecting", (data) => {
    if (!data.isCollecting) return;
    const emails = scanPage();
    if (emails.length === 0) return;
    chrome.runtime.sendMessage({ type: "EMAILS_FOUND", emails }, () => {
      void chrome.runtime.lastError;
    });
  });
}

function scheduleSend() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    sendIfCollecting();
  }, 450);
}

sendIfCollecting();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.isCollecting) return;
  if (changes.isCollecting.newValue) sendIfCollecting();
});

const observer = new MutationObserver(() => {
  scheduleSend();
});
if (document.documentElement) {
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}
