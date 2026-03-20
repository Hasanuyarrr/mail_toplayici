const STORAGE_KEY = "collectedEmails";
const COLLECTING_KEY = "isCollecting";
const TLD_PREF_KEY = "exportIncludeTld";
const DOMAIN_PREF_KEY = "exportIncludeDomain";

const toggle = document.getElementById("toggle");
const stats = document.getElementById("stats");
const exportBtn = document.getElementById("export");
const clearBtn = document.getElementById("clear");
const purgeBtn = document.getElementById("purge-excluded");
const exportMeta = document.getElementById("export-meta");
const tldListEl = document.getElementById("tld-list");
const domainListEl = document.getElementById("domain-list");

document.getElementById("tld-all").addEventListener("click", () => setAllTld(true));
document.getElementById("tld-none").addEventListener("click", () => setAllTld(false));
document.getElementById("dom-all").addEventListener("click", () => setAllDomain(true));
document.getElementById("dom-none").addEventListener("click", () => setAllDomain(false));

function domainOf(email) {
  const i = email.lastIndexOf("@");
  if (i <= 0) return "";
  return email
    .slice(i + 1)
    .toLowerCase()
    .trim();
}

function tldOf(domain) {
  const parts = domain.split(".").filter(Boolean);
  if (parts.length === 0) return "";
  return parts[parts.length - 1].toLowerCase();
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b));
}

function collectKeysFromEmails(emails) {
  const domains = [];
  const tlds = [];
  for (const e of emails) {
    const d = domainOf(e);
    if (!d) continue;
    domains.push(d);
    const t = tldOf(d);
    if (t) tlds.push(t);
  }
  return { domains: uniqueSorted(domains), tlds: uniqueSorted(tlds) };
}

function mergePrefs(keys, existing) {
  const out = { ...(existing || {}) };
  for (const k of keys) {
    if (out[k] === undefined) out[k] = true;
  }
  for (const k of Object.keys(out)) {
    if (!keys.includes(k)) delete out[k];
  }
  return out;
}

function emailPassesFilters(email, tldPref, domainPref) {
  const d = domainOf(email);
  if (!d) return false;
  const t = tldOf(d);
  const tldOk = t ? tldPref[t] !== false : true;
  const domainOk = domainPref[d] !== false;
  return tldOk && domainOk;
}

function filterEmailsForExport(emails, tldPref, domainPref) {
  return emails.filter((e) => emailPassesFilters(e, tldPref, domainPref));
}

function getState(callback) {
  chrome.storage.local.get(
    [COLLECTING_KEY, STORAGE_KEY, TLD_PREF_KEY, DOMAIN_PREF_KEY],
    (data) => {
      const list = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      const { domains, tlds } = collectKeysFromEmails(list);
      const tldPref = mergePrefs(tlds, data[TLD_PREF_KEY]);
      const domainPref = mergePrefs(domains, data[DOMAIN_PREF_KEY]);
      callback({
        collecting: !!data[COLLECTING_KEY],
        list,
        tlds,
        domains,
        tldPref,
        domainPref,
      });
    }
  );
}

function persistPrefs(tldPref, domainPref, done) {
  chrome.storage.local.set({ [TLD_PREF_KEY]: tldPref, [DOMAIN_PREF_KEY]: domainPref }, done);
}

function renderFilters(state) {
  const { list, tlds, domains, tldPref, domainPref } = state;

  tldListEl.innerHTML = "";
  if (tlds.length === 0) {
    tldListEl.textContent = "Henüz TLD yok.";
  } else {
    for (const t of tlds) {
      const id = `tld-${t}`;
      const wrap = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = tldPref[t] !== false;
      cb.dataset.kind = "tld";
      cb.dataset.key = t;
      cb.id = id;
      wrap.appendChild(cb);
      wrap.appendChild(document.createTextNode(` .${t}`));
      tldListEl.appendChild(wrap);
    }
  }

  domainListEl.innerHTML = "";
  if (domains.length === 0) {
    domainListEl.textContent = "Henüz alan adı yok.";
  } else {
    for (const d of domains) {
      const id = `dom-${d}`;
      const wrap = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = domainPref[d] !== false;
      cb.dataset.kind = "domain";
      cb.dataset.key = d;
      cb.id = id;
      wrap.appendChild(cb);
      wrap.appendChild(document.createTextNode(` ${d}`));
      domainListEl.appendChild(wrap);
    }
  }

  const included = filterEmailsForExport(list, tldPref, domainPref);
  exportMeta.textContent =
    list.length === 0
      ? ""
      : `İndirilecek: ${included.length} / ${list.length} adres`;

  exportBtn.disabled = list.length === 0 || included.length === 0;
  clearBtn.disabled = list.length === 0;
  purgeBtn.disabled = list.length === 0 || included.length === list.length;
}

function readCheckboxesIntoPrefs() {
  const tldPref = {};
  tldListEl.querySelectorAll('input[data-kind="tld"]').forEach((cb) => {
    tldPref[cb.dataset.key] = cb.checked;
  });
  const domainPref = {};
  domainListEl.querySelectorAll('input[data-kind="domain"]').forEach((cb) => {
    domainPref[cb.dataset.key] = cb.checked;
  });
  return { tldPref, domainPref };
}

function refreshUI() {
  getState((state) => {
    toggle.checked = state.collecting;
    stats.textContent = `Kayıtlı adres: ${state.list.length}`;
    chrome.storage.local.set(
      { [TLD_PREF_KEY]: state.tldPref, [DOMAIN_PREF_KEY]: state.domainPref },
      () => getState(renderFilters)
    );
  });
}

function attachCheckboxListeners() {
  const onChange = () => {
    const { tldPref, domainPref } = readCheckboxesIntoPrefs();
    persistPrefs(tldPref, domainPref, () => {
      getState(renderFilters);
    });
  };
  tldListEl.addEventListener("change", onChange);
  domainListEl.addEventListener("change", onChange);
}

attachCheckboxListeners();

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ [COLLECTING_KEY]: toggle.checked }, refreshUI);
});

function setAllTld(checked) {
  getState((state) => {
    const next = { ...state.tldPref };
    for (const t of state.tlds) next[t] = checked;
    persistPrefs(next, state.domainPref, refreshUI);
  });
}

function setAllDomain(checked) {
  getState((state) => {
    const next = { ...state.domainPref };
    for (const d of state.domains) next[d] = checked;
    persistPrefs(state.tldPref, next, refreshUI);
  });
}

exportBtn.addEventListener("click", () => {
  getState((state) => {
    const included = filterEmailsForExport(state.list, state.tldPref, state.domainPref);
    const text = included.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `mailler-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    chrome.downloads.download({ url, filename, saveAs: true });
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
});

purgeBtn.addEventListener("click", () => {
  getState((state) => {
    const kept = filterEmailsForExport(state.list, state.tldPref, state.domainPref);
    if (kept.length === state.list.length) return;
    chrome.storage.local.set({ [STORAGE_KEY]: kept }, refreshUI);
  });
});

clearBtn.addEventListener("click", () => {
  chrome.storage.local.set({ [STORAGE_KEY]: [], [TLD_PREF_KEY]: {}, [DOMAIN_PREF_KEY]: {} }, refreshUI);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes[STORAGE_KEY] || changes[COLLECTING_KEY] || changes[TLD_PREF_KEY] || changes[DOMAIN_PREF_KEY]) {
    refreshUI();
  }
});

refreshUI();
