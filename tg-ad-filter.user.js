// ==UserScript==
// @name         Telegram Ad Filter (Read-safe)
// @version      1.5.1
// @description  Removes official Telegram sponsored messages and hides keyword-based ads without breaking read status
// @license      MIT
// @author       VChet
// @icon         https://web.telegram.org/favicon.ico
// @namespace    telegram-ad-filter
// @match        https://web.telegram.org/k/*
// @match        https://web.telegram.org/a/*
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/* jshint esversion: 11 */

const globalStyles = `
/* 官方 Sponsored 直接移除 */
.bubble.is-sponsored,
.bubble[data-is-sponsored="true"],
.sponsored-message {
  display: none !important;
}

/* 命中关键词广告时，隐藏图片 / 视频 */
.bubble.has-advertisement .attachment {
  display: none;
}

/* 隐藏正文（你之前已经有，可以保留） */
.bubble.has-advertisement .message {
  display: none;
}

/* 隐藏评论入口（Leave a comment） */
.bubble.has-advertisement replies-element.replies-footer {
  display: none;
}

/* 隐藏转发按钮 */
.bubble.has-advertisement .bubble-beside-button.forward {
  display: none;
}

/* 提示条 */
.advertisement {
  opacity: 0.7;
  font-size: 0.9em;
  display: block;
  padding: 0.5rem 1rem;
  cursor: pointer;
  white-space: nowrap;
  font-style: italic;
  font-weight: var(--font-weight-bold);
  color: var(--secondary-text-color);
}
`;

const frameStyle = `
  inset: 115px auto auto 130px;
  border: 1px solid rgb(0, 0, 0);
  height: 300px;
  max-height: 95%;
  max-width: 95%;
  position: fixed;
  width: 75%;
  z-index: 9999;
`;

const popupStyle = `
#telegram-ad-filter {
  background: #181818;
  color: #ffffff;
}
#telegram-ad-filter textarea {
  resize: vertical;
  width: 100%;
  min-height: 150px;
}
`;

function isOfficialSponsored(node) {
  if (
    node.classList.contains("is-sponsored") ||
    node.hasAttribute("data-is-sponsored") ||
    node.classList.contains("sponsored-message")
  ) return true;

  const label = node.querySelector("[class*='sponsor']");
  return label?.textContent?.toLowerCase().includes("sponsor");
}

function handleMessageNode(node, adWords) {
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

  const keyword = adWords.find(w =>
    text.includes(w.toLowerCase()) ||
    links.some(l => l.includes(w.toLowerCase()))
  );

  if (!keyword) return;

  const trigger = document.createElement("div");
  trigger.className = "advertisement";
  trigger.textContent = `Hidden by filter for <${keyword}>`;

  trigger.onclick = () => {
    node.classList.toggle("has-advertisement");
  };

  node.querySelector(".bubble-content")?.prepend(trigger);
  node.classList.add("has-advertisement");
}

const settingsConfig = {
  id: "telegram-ad-filter",
  frameStyle,
  css: popupStyle,
  title: "Telegram Ad Filter Settings",
  fields: {
    listUrls: {
      label: "Blacklist URLs (JSON array, one URL per line)",
      type: "textarea",
      default:
        "https://raw.githubusercontent.com/jiaweiding/telegram-ad-filter/refs/heads/master/blacklist.json"
    }
  }
};

function isValidURL(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchLists(urlsString) {
  const urls = urlsString.split("\n").map(u => u.trim()).filter(Boolean);
  const set = new Set();

  for (const url of urls) {
    if (!isValidURL(url)) continue;
    const res = await fetch(url).then(r => r.json());
    if (Array.isArray(res)) {
      res.filter(x => typeof x === "string").forEach(x => set.add(x.trim()));
    }
  }
  return [...set];
}

(async () => {
  GM_addStyle(globalStyles);

  let adWords = [];

  const gmc = new GM_configStruct({
    ...settingsConfig,
    events: {
      init: async function () {
        adWords = await fetchLists(this.get("listUrls"));
      },
      save: async function () {
        adWords = await fetchLists(this.get("listUrls"));
        this.close();
      }
    }
  });

  function walk(node) {
    if (!(node instanceof HTMLElement)) return;

    if (node.matches(".bubble")) {
      handleMessageNode(node, adWords);
    }

    for (const child of node.children) walk(child);
  }

  new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
