import {
  globalStyles,
  handleMessageNode,
  MESSAGE_NODE_SELECTOR,
  resetMessageNode
} from "./DOM";
import { fetchKeywordList } from "./fetch";

(async() => {
  GM_addStyle(globalStyles);

  let adWords: string[] = [];

  const refreshPage = (): void => {
    document.querySelectorAll<HTMLElement>(MESSAGE_NODE_SELECTOR).forEach((element) => {
      resetMessageNode(element);
      handleMessageNode(element, adWords);
    });
  };

  function walk(node: Node): void {
    if (!(node instanceof HTMLElement)) { return; }

    if (node.matches(MESSAGE_NODE_SELECTOR)) {
      handleMessageNode(node, adWords);
    }

    node.querySelectorAll<HTMLElement>(MESSAGE_NODE_SELECTOR).forEach((element) => {
      handleMessageNode(element, adWords);
    });
  }

  function mutationHandler(mutationRecords: MutationRecord[]): void {
    for (const { type, addedNodes } of mutationRecords) {
      if (type === "childList" && typeof addedNodes === "object" && addedNodes.length) {
        for (const node of addedNodes) { walk(node); }
      }
    }
  }

  const observer = new MutationObserver(mutationHandler);
  const root = document.body ?? document.documentElement;
  observer.observe(root, { childList: true, subtree: true });
  walk(root);

  try {
    adWords = await fetchKeywordList();
    refreshPage();
  } catch (error) {
    console.error("[Telegram Ad Filter]", error);
  }
})();
