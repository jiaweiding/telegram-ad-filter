// ==UserScript==
// @name         Telegram Ad Filter TEST
// @version      1.5.0-test
// @description  Test version
// @license      MIT
// @author       VChet
// @icon         https://web.telegram.org/favicon.ico
// @namespace    telegram-ad-filter-test
// @match        https://web.telegram.org/k/*
// @match        https://web.telegram.org/a/*
// @grant        none
// ==/UserScript==

console.log("========================================");
console.log("[TEST] Script is running!");
console.log("[TEST] Current URL:", window.location.href);
console.log("[TEST] Document ready state:", document.readyState);
console.log("========================================");

// Simple test to verify script works
setTimeout(() => {
    console.log("[TEST] 5 seconds passed, checking for bubbles...");
    const bubbles = document.querySelectorAll(".bubble");
    console.log("[TEST] Found bubbles:", bubbles.length);
    if (bubbles.length > 0) {
        console.log("[TEST] First bubble:", bubbles[0]);
    }
}, 5000);
