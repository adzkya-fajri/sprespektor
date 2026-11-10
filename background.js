/**
 * Background Service Worker (Manifest V3)
 * Bertanggung jawab menerima klik toolbar icon dan mengelola badge counter
 */

// Listener saat ikon ekstensi di toolbar diklik
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Cek apakah halaman dapat diinjeksi (bukan chrome:// atau chrome Web Store)
  const isRestrictedUrl = tab.url && (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("https://chromewebstore.google.com")
  );

  if (isRestrictedUrl) {
    console.warn("Ekstensi tidak dapat berjalan di halaman internal peramban.");
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
      console.error("Gagal menginjeksi content script:", injectError);
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
