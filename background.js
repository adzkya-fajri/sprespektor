/**
 * Background Service Worker (Manifest V3)
 * Bertanggung jawab menerima klik toolbar icon dan mengelola badge counter
 */

// Listener saat ikon ekstensi di toolbar diklik
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  const url = tab.url || tab.pendingUrl || "";
  const isRestrictedUrl = 
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://") ||
    url.startsWith("view-source:") ||
    url.includes("chromewebstore.google.com");

  // Jika pengguna mengklik di halaman sistem browser (chrome://), jangan buka tab baru, cukup beri indikasi visual
  if (isRestrictedUrl) {
    console.warn("Ekstensi overlay tidak dapat disuntikkan ke dalam halaman internal browser (chrome://). Silakan buka di halaman website biasa.");
    chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#e11d48" });
    chrome.action.setTitle({
      tabId: tab.id,
      title: "Buka website biasa (misal: google.com) untuk menampilkan widget overlay"
    });
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId: tab.id, text: "" });
      chrome.action.setTitle({ tabId: tab.id, title: "Buka To-Do List Overlay" });
    }, 3000);
    return;
  }

  // Jika berada di halaman web biasa, toggle floating overlay drawer langsung di layar!
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_WIDGET" });
  } catch (error) {
    // Jika content script belum terpasang di tab (misal tab sudah dibuka sebelum ekstensi di-reload)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["db.js", "content_script.js"]
      });
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_WIDGET" });
        } catch (e) {
          console.warn("Pesan toggle tidak terkirim (halaman sedang memuat):", e);
        }
      }, 100);
    } catch (injectError) {
      console.warn("Halaman tidak mengizinkan injeksi content script:", injectError);
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
