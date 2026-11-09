# Rancangan Back-End & Data Storage: Overlay To-Do List

## 1. Background Service Worker (`background.js`)

Pada arsitektur Chrome Extension Manifest V3, background berjalan secara *event-driven* (service worker). Tanggung jawab utama service worker dalam sistem ini meliputi:
1. **Action Click Handler:** Menerima klik pada ikon ekstensi di toolbar browser dan mengirimkan pesan `TOGGLE_DRAWER` ke tab web yang sedang aktif.
2. **Badge Counter Manager:** Mengelola teks badge (`chrome.action.setBadgeText`) dan warna latar badge (`chrome.action.setBadgeBackgroundColor`) agar menampilkan jumlah tugas aktif yang belum selesai.
3. **Storage Listener:** Mendengarkan perubahan data di `chrome.storage.onChanged` sehingga jika ada tab lain yang memperbarui daftar tugas, badge toolbar dan panel di tab aktif langsung ter-update secara real-time.

---

## 2. Skema Data & Model (`chrome.storage.local`)

Data disimpan dengan key `"todos"` berisi array of task objects:

```typescript
interface TodoItem {
  id: string;          // Timestamp unik / UUID string (e.g. "todo_1731112345678")
  text: string;        // Isi teks tugas (string aman yang telah disanitasi)
  completed: boolean;  // Status selesai (true / false)
  createdAt: number;   // Epoch timestamp saat pembuatan (Date.now())
}

interface StorageSchema {
  todos: TodoItem[];
}
```

Contoh payload dalam storage:
```json
{
  "todos": [
    {
      "id": "task_1731110001",
      "text": "Review PR migrasi Manifest V3",
      "completed": false,
      "createdAt": 1731110001000
    },
    {
      "id": "task_1731110002",
      "text": "Rilis build ekstensi ke Chrome Web Store",
      "completed": true,
      "createdAt": 1731105000000
    }
  ]
}
```

---

## 3. Protokol Pesan Antar-Komponen (Runtime Messaging)

| Aksi / Tipe Pesan | Pengirim | Penerima | Payload | Deskripsi |
|---|---|---|---|---|
| `TOGGLE_DRAWER` | `background.js` | `content_script.js` | `{}` | Membuka / menutup drawer overlay di tab aktif |
| `UPDATE_BADGE` | `content_script.js` | `background.js` | `{ count: number }` | Memperbarui teks badge counter di ikon toolbar |
| `SYNC_STORAGE` | `chrome.storage.onChanged` | `content_script.js` | `{ newValue: TodoItem[] }` | Menjamin sinkronisasi multi-tab secara konsisten |

---

## 4. Penanganan Error & Keamanan (Error Handling & Security)
- **Safe Messaging:** Pengiriman pesan ke `chrome.tabs.sendMessage` dibungkus dalam blok `try/catch` dan mengecek `chrome.runtime.lastError` untuk mencegah error saat pengguna berada di halaman terproteksi browser (seperti `chrome://extensions` atau Chrome Web Store).
- **Sanitasi Konten:** Semua teks tugas disisipkan ke DOM menggunakan `document.createTextNode` atau `textContent` murni, bukan `innerHTML`, guna mencegah serangan XSS (*Cross-Site Scripting*).
- **Storage Quota & Graceful Fallback:** Semua pembacaan dan penulisan storage diverifikasi untuk memastikan data selalu berstatus array yang valid.
