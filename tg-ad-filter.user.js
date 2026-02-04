// ==UserScript==
// @name         Telegram Ad Filter (Read-safe, Minimal)
// @version      1.6.0
// @description  Hide Telegram ads safely without breaking read status
// @license      MIT
// @author       VChet
// @icon         https://web.telegram.org/favicon.ico
// @namespace    telegram-ad-filter
// @match        https://web.telegram.org/k/*
// @match        https://web.telegram.org/a/*
// @grant        GM_addStyle
// ==/UserScript==

/* jshint esversion: 11 */

const BLACKLIST_URL =
  "https://raw.githubusercontent.com/jiaweiding/telegram-ad-filter/refs/heads/master/blacklist.json";

/* ===================== CSS ===================== */

GM_addStyle(`
/* 官方 Sponsored 直接移除 */
.bubble.is-sponsored,
.bubble[data-is-sponsored="true"],
.sponsored-message {
  display: none !important;
}

/* 命中关键词广告时隐藏内容 */
.bubble.has-advertisement .attachment,
.bubble.has-advertisement .message,
.bubble.has-advertisement replies-element.replies-footer,
.bubble.has-advertisement .bubble-beside-button.forward {
  display: none;
}

/* 提示条 */
.advertisement {
  opacity: 0.7;
  font-size: 0.9em;
  padding: 0.5rem 1rem;
  cursor: pointer;
  white-space: nowrap;
  font-style: italic;
  font-weight: var(--font-weight-bold);
  color: var(--secondary-text-color);
}
`);

/* ===================== Logic ===================== */

function isOfficialSponsored(node) {
  if (
    node.classList.contains("is-sponsored") ||
    node.hasAttribute("data-is-sponsored") ||
    node.classList.contains("sponsored-message")
  ) return true;

  const label = node.querySelector("[class*='sponsor']");
  return label?.textContent?.toLowerCase().includes("sponsor");
}

function handleBubble(node, keywords) {
  if (!node.classList.contains("bubble")) return;
  if (node.dataset.adProcessed) return;
  node.dataset.adProcessed = "1";

  if (isOfficialSponsored(node)) {
    node.classList.add("is-sponsored");
    node.dataset.isSponsored = "true";
    return;
  }

  const message = node.querySelector(".message");
  if (!message) return;

  const text = message.textContent?.toLowerCase() || "";
  const links = [...message.querySelectorAll("a")].map(a => a.href.toLowerCase());

  const hit = keywords.find(k =>
    text.includes(k) || links.some(l => l.includes(k))
  );

  if (!hit) return;

  const tip = document.createElement("div");
  tip.className = "advertisement";
  tip.textContent = `Hidden by filter for <${hit}>`;
  tip.onclick = () => node.classList.toggle("has-advertisement");

  node.querySelector(".bubble-content")?.prepend(tip);
  node.classList.add("has-advertisement");
}

/* ===================== Bootstrap ===================== */

(async () => {
  let keywords = [];

  try {
    const res = await fetch(BLACKLIST_URL);
    const data = await res.json();
    if (Array.isArray(data)) {
      keywords = data
        .filter(x => typeof x === "string")
        .map(x => x.trim().toLowerCase());
    }
  } catch (e) {
    console.error("[TG Ad Filter] Failed to load blacklist", e);
    return;
  }

  const walk = node => {
    if (!(node instanceof HTMLElement)) return;
    if (node.classList.contains("bubble")) {
      handleBubble(node, keywords);
    }
    for (const c of node.children) walk(c);
  };

  new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
