# Rancangan Back-End & Data Storage: Overlay To-Do List

## 1. Background Service Worker (`background.js`)

Pada arsitektur Chrome Extension Manifest V3, background berjalan secara *event-driven* (service worker). Tanggung jawab utama service worker dalam sistem ini meliputi:
1. **Action Click Handler:** Menerima klik pada ikon ekstensi di toolbar browser dan mengirimkan pesan `TOGGLE_DRAWER` ke tab web yang sedang aktif.
2. **Badge Counter Manager:** Mengelola teks badge (`chrome.action.setBadgeText`) dan warna latar badge (`chrome.action.setBadgeBackgroundColor`) agar menampilkan jumlah tugas aktif yang belum selesai.
3. **Storage Listener:** Mendengarkan perubahan data di `chrome.storage.onChanged` sehingga jika ada tab lain yang memperbarui daftar tugas, badge toolbar dan panel di tab aktif langsung ter-update secara real-time.

---

## 2. Skema Data & Struktur Database (`chrome.storage.local`)

Karena ekstensi berjalan pada browser tanpa ketergantungan server luar, basis data utama menggunakan **`chrome.storage.local`** (NoSQL Key-Value Store berbasis JSON yang persisten dan cepat).

### 2.1. Skema Entitas Tugas (`TodoItem`)

Setiap item tugas memiliki struktur objek data terstandarisasi sebagai berikut:

```typescript
interface TodoItem {
  id: string;          // Identifier unik (misal: "todo_1731112345678" atau crypto.randomUUID())
  text: string;        // Isi teks tugas (string yang telah disanitasi)
  completed: boolean;  // Status pengerjaan (false = aktif, true = selesai)
  dueDate: string;     // Tanggal jatuh tempo kalender akurat (Format ISO: "YYYY-MM-DD", misal: "2026-11-10")
  createdAt: number;   // Epoch timestamp waktu pembuatan tugas (Date.now())
  updatedAt?: number;  // Epoch timestamp saat terakhir diubah
}
```

### 2.2. Skema Konfigurasi Pengguna (`UserSettings`)

Untuk menyimpan preferensi tampilan pengguna agar tidak hilang saat browser ditutup:

```typescript
interface UserSettings {
  selectedTheme: string;  // ID tema aktif (misal: "01", "03", "04")
  lastActiveFilter: string; // "all" | "active" | "completed"
}
```

### 2.3. Struktur Root Database (`StorageSchema`)

```typescript
interface StorageSchema {
  todos: TodoItem[];
  settings: UserSettings;
}
```

### 2.4. Contoh Payload JSON Nyata di Storage

```json
{
  "todos": [
    {
      "id": "todo_1731110001",
      "text": "read the md",
      "completed": false,
      "dueDate": "2026-11-10",
      "createdAt": 1731110001000,
      "updatedAt": 1731110001000
    },
    {
      "id": "todo_1731105000",
      "text": "read the md",
      "completed": false,
      "dueDate": "2026-11-01",
      "createdAt": 1731105000000,
      "updatedAt": 1731105000000
    },
    {
      "id": "todo_1731090000",
      "text": "review manifest v3 architecture",
      "completed": true,
      "dueDate": "2026-11-13",
      "createdAt": 1731090000000,
      "updatedAt": 1731108000000
    }
  ],
  "settings": {
    "selectedTheme": "01",
    "lastActiveFilter": "all"
  }
}
```

---

## 3. Logika Komputasi Hari Relatif di Sisi Klien

Teks badge di samping kanan (`Hari ini`, `Besok`, `-9 hr`, `+3 hr`) **tidak disimpan secara statis sebagai string di database**, melainkan **dihitung secara dinamis** setiap kali UI merender data berdasarkan perbandingan tanggal kalender tugas (`dueDate`) dengan tanggal hari ini saat ekstensi dibuka:

$$\Delta\text{Hari} = \text{Date}(\text{dueDate}) - \text{Date}(\text{today})$$

- $\Delta\text{Hari} = 0 \longrightarrow$ Tampilkan **`Hari ini`**
- $\Delta\text{Hari} = 1 \longrightarrow$ Tampilkan **`Besok`**
- $\Delta\text{Hari} > 1 \longrightarrow$ Tampilkan **`+N hr`** (misal: `+3 hr`)
- $\Delta\text{Hari} < 0 \longrightarrow$ Tampilkan **`-N hr`** (misal: `-9 hr`, overdue / terlewat)

*Keuntungan Pendekatan Ini:* Jika pengguna membuka ekstensi keesokan harinya, tugas yang kemarin berlabel `Besok` otomatis berubah menjadi `Hari ini`, dan tugas yang berlabel `Hari ini` otomatis berubah menjadi `-1 hr` tanpa perlu memodifikasi isi database!

---

## 4. Alur Operasi CRUD (Data Lifecycle)

1. **Create (Tambah Tugas):**
   - Ambil teks dari input dan tanggal dari `<input type="date">`.
   - Buat objek `TodoItem` baru dengan ID berbasis timestamp.
   - Tambahkan ke indeks teratas array `todos` (unshift).
   - Simpan kembali ke `chrome.storage.local.set({ todos })`.
2. **Read (Baca & Filter):**
   - Ambil data via `chrome.storage.local.get(["todos", "settings"])`.
   - Validasi skema (fallback ke `[]` jika kosong/corrupt).
   - Filter berdasarkan tab (`Semua` / `Aktif` / `Selesai`).
   - Urutkan: tugas aktif yang paling mendesak/terlewat berada di atas, tugas selesai di bawah.
3. **Update (Toggle Selesai & Edit):**
   - Cari item berdasarkan `id`.
   - Ubah `completed = !completed` dan perbarui `updatedAt = Date.now()`.
   - Simpan ke storage dan sinkronkan badge toolbar (`chrome.action.setBadgeText`).
4. **Delete (Hapus Tugas):**
   - Hapus item terpilih via `todos.filter(t => t.id !== id)`.
   - Hapus massal tugas selesai via `todos.filter(t => !t.completed)`.

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
