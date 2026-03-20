export const MESSAGE_NODE_SELECTOR = ".bubble, .message-list-item, .Message, .SponsoredMessage";

let placeholderId = 0;

export const globalStyles = `
  .SponsoredMessage,
  .sponsored-media-preview,
  [data-telegram-ad-filter-sponsored="true"],
  .sponsored-message {
    display: none !important;
  }
  .advertisement-row {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 0.375rem 0 0.5rem;
    pointer-events: auto;
  }
  .advertisement {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    max-width: min(calc(100% - 1rem), 11rem);
    min-height: 2rem;
    padding: 0.45rem 0.8rem;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-secondary, rgb(112 117 121));
    background: var(--color-background-compact-menu, rgb(255 255 255 / 86%));
    box-shadow:
      0 0.125rem 0.375rem rgb(0 0 0 / 10%),
      0 0.5rem 1rem rgb(0 0 0 / 8%);
    text-align: center;
    backdrop-filter: blur(0.75rem);
    transition: transform 160ms ease, background-color 160ms ease, color 160ms ease;
  }
  .advertisement:hover {
    transform: translateY(-1px);
    background: var(--color-background-compact-menu-reactions, rgb(255 255 255 / 94%));
  }
  .advertisement:active {
    transform: translateY(0);
    background: var(--color-background-compact-menu-hover, rgb(0 0 0 / 0.067));
  }
  .advertisement__text {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .advertisement__hint {
    flex: 0 0 auto;
    color: var(--color-primary, rgb(51 144 236));
    font-size: 0.75rem;
    font-weight: 700;
  }
`;

export function handleSponsoredMessage(node: HTMLElement): boolean {
  if (node.classList.contains("SponsoredMessage")) {
    return true;
  }

  if (node.classList.contains("sponsored-media-preview")) {
    return true;
  }

  if (node.classList.contains("is-sponsored")) {
    return true;
  }

  if (node.hasAttribute("data-is-sponsored")) {
    return true;
  }

  if (node.classList.contains("sponsored-message")) {
    return true;
  }

  const sponsoredLabel = node.querySelector([
    ".sponsored-label",
    ".sponsor-label",
    ".ad-about",
    ".SponsoredMessage__button",
    ".message-title.message-type",
    "[class*=\"sponsor\"]",
    "[class*=\"Sponsored\"]"
  ].join(", "));
  if (sponsoredLabel && sponsoredLabel.textContent?.toLowerCase().includes("sponsor")) {
    return true;
  }

  const typeLabel = node.querySelector(".message-title.message-type");
  if (typeLabel && typeLabel.textContent?.trim().toLowerCase() === "ad") {
    return true;
  }

  const message = getMessageElement(node);
  if (message) {
    const messageText = message.textContent?.toLowerCase() || "";
    if (messageText.includes("sponsored") || messageText.includes("what's this?")) {
      return true;
    }
  }

  return false;
}

function getMessageElement(node: HTMLElement): HTMLElement | null {
  return node.querySelector<HTMLElement>([
    ".message",
    ".text-content",
    ".WebPage-text",
    ".translatable-message",
    ".message-content",
    "[class*=\"message-content\"]"
  ].join(", "));
}

function getPlaceholderSelector(node: HTMLElement): string | null {
  const nodeId = node.dataset.telegramAdFilterNodeId;
  if (!nodeId) { return null; }
  return `[data-telegram-ad-filter-placeholder-for="${nodeId}"]`;
}

function getOrAssignNodeId(node: HTMLElement): string {
  if (!node.dataset.telegramAdFilterNodeId) {
    placeholderId += 1;
    node.dataset.telegramAdFilterNodeId = String(placeholderId);
  }

  return node.dataset.telegramAdFilterNodeId;
}

export function resetMessageNode(node: HTMLElement): void {
  const placeholderSelector = getPlaceholderSelector(node);
  if (placeholderSelector) {
    node.parentElement?.querySelectorAll(placeholderSelector).forEach((element) => {
      element.remove();
    });
  }

  delete node.dataset.telegramAdFilterCollapsed;
  delete node.dataset.telegramAdFilterSponsored;
  delete node.dataset.telegramAdFilterRevealed;

  node.style.removeProperty("display");
}

export function handleMessageNode(node: HTMLElement, adWords: string[]): void {
  if (getPlaceholderSelector(node) && node.parentElement?.querySelector(getPlaceholderSelector(node) ?? "")) { return; }

  if (handleSponsoredMessage(node)) {
    node.dataset.telegramAdFilterSponsored = "true";
    return;
  }

  const message = getMessageElement(node);
  if (!message) { return; }

  const textContent = message.textContent?.toLowerCase();
  const links = [...message.querySelectorAll("a")].reduce((acc: string[], { href }) => {
    if (href) { acc.push(href.toLowerCase()); }
    return acc;
  }, []);
  if (!textContent && !links.length) { return; }

  let matchedKeyword: string | null = null;
  const filters = adWords.map((filter) => filter.toLowerCase());
  for (const filter of filters) {
    if (textContent?.includes(filter) || links.some((href) => href.includes(filter))) {
      matchedKeyword = adWords.find(word => word.toLowerCase() === filter) || null;
      break;
    }
  }
  if (!matchedKeyword) { return; }

  const parent = node.parentElement;
  if (!parent) { return; }

  const nodeId = getOrAssignNodeId(node);
  const row = document.createElement("div");
  row.className = "advertisement-row";
  row.dataset.telegramAdFilterPlaceholderFor = nodeId;

  const trigger = document.createElement("button");
  trigger.classList.add("advertisement");
  trigger.dataset.telegramAdFilterTrigger = "true";
  trigger.type = "button";
  trigger.title = `Toggle filtered message: ${matchedKeyword}`;
  trigger.setAttribute("aria-label", `Toggle filtered message: ${matchedKeyword}`);

  const text = document.createElement("span");
  text.className = "advertisement__text";
  text.textContent = `Filtered by ${matchedKeyword}`;

  const hint = document.createElement("span");
  hint.className = "advertisement__hint";
  const applyFilteredState = (revealed: boolean): void => {
    node.dataset.telegramAdFilterRevealed = revealed ? "true" : "false";
    node.dataset.telegramAdFilterCollapsed = revealed ? "false" : "true";
    hint.textContent = revealed ? "Hide" : "Show";

    if (revealed) {
      node.style.removeProperty("display");
      return;
    }

    node.style.setProperty("display", "none", "important");
  };

  trigger.append(text, hint);
  row.append(trigger);
  parent.insertBefore(row, node);

  applyFilteredState(false);
  trigger.addEventListener("click", () => {
    applyFilteredState(node.dataset.telegramAdFilterRevealed !== "true");
  });
}
