/**
 * Background Service Worker (Manifest V3)
 * Bertanggung jawab menerima klik toolbar icon dan mengelola badge counter
 */

// Helper memberi sinyal visual saat ekstensi diklik di halaman internal yang dilarang
function showRestrictedWarning(tabId) {
  if (!tabId) return;
  chrome.action.setBadgeText({ tabId, text: "!" });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#e11d48" });
  chrome.action.setTitle({
    tabId,
    title: "Ekstensi tidak dapat berjalan di halaman internal peramban (chrome://). Silakan buka halaman web biasa."
  });
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: "" });
    chrome.action.setTitle({ tabId, title: "Buka To-Do List" });
  }, 3500);
}

// Listener saat ikon ekstensi di toolbar diklik
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  const url = tab.url || tab.pendingUrl || "";
  // Cek apakah halaman dapat diinjeksi (Chrome melarang keras injeksi di chrome://, chrome-extension://, dll.)
  const isRestrictedUrl = 
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://") ||
    url.startsWith("view-source:") ||
    url.includes("chromewebstore.google.com");

  if (isRestrictedUrl) {
    console.warn("Ekstensi tidak dapat berjalan di tab internal peramban (chrome:// atau New Tab kosong). Silakan buka halaman web biasa (misal: http://localhost:3333/prototypes-preview.html atau situs publik).");
    showRestrictedWarning(tab.id);
    return;
  }

  try {
    // Kirim pesan toggle ke tab aktif
    await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_WIDGET" });
  } catch (error) {
    // Jika content script belum terinjeksi (misal pada tab yang sudah terbuka sebelum ekstensi di-load)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["db.js", "content_script.js"]
      });
      // Coba kirim ulang setelah injeksi
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_WIDGET" });
        } catch (e) {
          console.error("Gagal mengirim pesan toggle setelah injeksi:", e);
        }
      }, 150);
    } catch (injectError) {
      const errMsg = injectError.message || String(injectError);
      if (errMsg.includes("chrome://") || errMsg.includes("Cannot access")) {
        console.warn("Halaman dibatasi oleh kebijakan keamanan browser (chrome://):", errMsg);
        showRestrictedWarning(tab.id);
      } else {
        console.error("Gagal menginjeksi content script:", errMsg);
      }
    }
  }
});

// Listener untuk pesan pembaruan badge counter dari content script
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
