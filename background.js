/**
 * Background Service Worker (Manifest V3)
 * Bertanggung jawab mengelola badge counter dan inisialisasi ekstensi
 */

// Listener untuk pesan pembaruan badge counter dari popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_BADGE") {
    const count = typeof message.count === "number" ? message.count : 0;
    const badgeText = count > 0 ? String(count) : "";

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
    sendResponse({ success: true });
  }
  return true;
});

// Inisialisasi saat ekstensi pertama kali di-install
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
