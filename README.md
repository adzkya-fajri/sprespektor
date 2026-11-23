<picture>
  <source media="(prefers-color-scheme: dark)" srcset="icons/icon128.png">
  <img alt="sprespektor" src="icons/icon128.png" width="80" height="80" align="left">
</picture>

# sprespektor

**Ekstensi Chrome To-Do List yang ringan, cepat, dan minimalis — tanpa server, tanpa login, tanpa internet.**

<br clear="left"/>

[![Manifest Version](https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB-green?logo=databricks&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Language](https://img.shields.io/badge/Language-JavaScript%20ES6-yellow?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-gray)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange)](manifest.json)

---

## Tampilan

> Desain popup 360px dengan tema **Light Minimalist Modern** — terlihat rapi di resolusi dan sistem operasi apapun.

```
┌──────────────────────────────────────────────────┐
│  Task (2)   Calender                         [+] │
├──────────────────────────────────────────────────┤
│  [ Tulis tugas baru lalu tekan Enter...  ↵Enter ]│
│  [📅 Senin, 23 Nov                     Hari ini ]│
├──────────────────────────────────────────────────┤
│  (Semua)  Aktif   Selesai                        │
├──────────────────────────────────────────────────┤
│  ○  Belajar IndexedDB & CSS      [Hari ini] ✎ ✕ │
│  ○  Review komponen Shadcn UI    [Besok]    ✎ ✕ │
│  ✓  Setup Chrome Extension MV3  [Selesai]  ✎ ✕ │
├──────────────────────────────────────────────────┤
│  2 tugas tersisa                   Hapus selesai │
└──────────────────────────────────────────────────┘
```

---

## Fitur Unggulan

| Fitur | Keterangan |
| :--- | :--- |
| 🗂️ **Dual Tab View** | Tab **Task** untuk daftar tugas dan tab **Calender** untuk tampilan mingguan interaktif |
| 📅 **Shadcn/UI Date Picker** | Pemilih tanggal modern bergaya Shadcn dengan grid kalender dan tombol cepat (*Hari ini*, *Besok*, *+7 Hari*) |
| ⏱️ **Badge Keterlambatan Relatif** | Label otomatis pada setiap tugas: `Hari ini`, `Besok`, `+3 hr`, atau `-2 hr` (merah jika terlambat) |
| ✏️ **Edit Inline** | Klik ganda atau tombol pensil `✎` untuk mengedit teks tugas langsung tanpa popup tambahan |
| 💾 **Penyimpanan Permanen (IndexedDB)** | Data tersimpan permanen di komputer Anda meskipun browser ditutup. Zero cloud, 100% privat |
| 🔢 **Badge Toolbar** | Angka jumlah tugas aktif muncul langsung di ikon toolbar Chrome |
| 📱 **Ringan & Cepat** | Tidak ada dependensi eksternal, tidak butuh `node_modules`, tidak butuh internet |
| 🔒 **100% Privat & Offline** | Tidak ada data yang dikirim ke server manapun |

---

## Cara Memasang Ekstensi

Ekstensi ini dipasang secara manual (*unpacked*) karena masih dalam tahap pengembangan lokal.

### Langkah 1 — Clone Repositori

```bash
git clone https://github.com/username/ukk-todo-extension.git
# atau unduh sebagai ZIP lalu ekstrak
```

### Langkah 2 — Buka Halaman Ekstensi Chrome

Ketik alamat berikut di address bar Chrome lalu tekan **Enter**:

```
chrome://extensions
```

### Langkah 3 — Aktifkan Mode Developer

Di pojok kanan atas halaman, aktifkan toggle:

```
Developer mode  ──►  ON
```

### Langkah 4 — Load Folder Ekstensi

1. Klik tombol **"Load unpacked"**.
2. Pilih folder hasil clone dari langkah 1 (folder yang berisi `manifest.json`).
3. Klik **"Select Folder"**.

### Langkah 5 — Ekstensi Siap!

Ikon ekstensi muncul di toolbar Chrome. Klik untuk membuka sprespektor.

> **Pastikan** Anda memilih folder **root** proyek (tempat `manifest.json` berada), bukan subfolder di dalamnya.

---

## Cara Menggunakan

### ➕ Menambahkan Tugas Baru
1. Klik tombol **`+`** di pojok kanan atas popup.
2. Ketik nama tugas di kolom input.
3. Pilih tanggal tenggat via tombol **📅 Date Picker**.
4. Tekan **Enter** untuk menyimpan.

### ✅ Menandai Tugas Selesai
Klik **lingkaran checkbox** di sisi kiri tugas. Tugas dicoret, badge berubah abu-abu.

### ✏️ Mengedit Tugas
- **Double-click** langsung pada teks tugas, atau
- Arahkan kursor → klik ikon **`✎`** yang muncul di kanan.
- Tekan **Enter** / klik **`✓`** untuk simpan, atau **`✕`** untuk batal.

### 🗑️ Menghapus Tugas
Arahkan kursor ke tugas → klik **`✕`** di ujung kanan.

### 📆 Menggunakan Tab Kalender
- Klik tab **"Calender"** untuk tampilan minggu.
- Klik tanggal manapun → lihat agenda tugas di tanggal tersebut.
- Gunakan **◀ ▶** untuk berpindah minggu, atau **"Hari Ini"** untuk kembali ke sekarang.

---

## Struktur Proyek

```
📁 sprespektor/
│
├── 📄 manifest.json       → Konfigurasi ekstensi Chrome (Manifest V3)
├── 📄 background.js       → Service Worker: pengatur badge angka di toolbar
├── 📄 db.js               → Wrapper IndexedDB (kelas TodoDatabase, CRUD async)
├── 📄 popup.html          → Antarmuka pengguna (HTML5, Dual Tab, Shadcn Picker)
├── 📄 popup.css           → Styling modern Light Minimalist (915 baris)
├── 📄 popup.js            → Logika interaksi, state, kalender, inline edit (760 baris)
│
├── 📁 icons/
│   ├── icon16.png         → Ikon 16×16 (favicon toolbar)
│   ├── icon48.png         → Ikon 48×48 (halaman chrome://extensions)
│   └── icon128.png        → Ikon 128×128 (Chrome Web Store)
│
└── 📁 todo-extension-doc/
    ├── MODUL_PENJELASAN_LENGKAP.md      → Arsitektur sistem & cara kerja IndexedDB
    ├── PANDUAN_KODE_DAN_ALUR_DATA.md    → Bedah kode & diagram alur data
    ├── PANDUAN_KUSTOMISASI_STYLE.md     → Referensi CSS & resep ubah tema
    └── changelog.md                     → Riwayat perubahan lengkap
```

---

## Stack Teknologi

```
Frontend (UI)
├── HTML5           → Struktur semantik popup
├── CSS3            → Animasi, Grid, Flexbox, Custom Properties
└── JavaScript ES6  → Vanilla JS murni (async/await, IIFE, DOM API)

Penyimpanan Data
└── IndexedDB (Browser API — bawaan Chrome, zero library)
    ├── Database    : TodoAppDB
    ├── Tabel todos : id (PK), text, dueDate, completed, createdAt, updatedAt
    │   ├── Index   : idx_dueDate
    │   ├── Index   : idx_completed
    │   └── Index   : idx_createdAt
    └── Tabel settings: key (PK), value

Chrome Extension APIs
├── chrome.action.setBadgeText            → Angka tugas di ikon toolbar
├── chrome.action.setBadgeBackgroundColor → Warna latar badge
├── chrome.runtime.onMessage              → Komunikasi popup ↔ service worker
└── chrome.runtime.onInstalled            → Inisialisasi saat pertama dipasang
```

---

## Perbandingan dengan Ekstensi Serupa

| Fitur | Ekstensi Ini | Ekstensi Rata-Rata |
| :--- | :---: | :---: |
| Butuh internet / server | ❌ Tidak | ✅ Ya |
| Butuh akun / login | ❌ Tidak | ✅ Ya |
| Data tersimpan di komputer Anda | ✅ Ya | ❌ Di cloud |
| Injeksi ke halaman web aktif | ❌ Tidak (Action Popup) | ✅ Ya (rawan error di `chrome://`) |
| Bisa dibuka di tab `chrome://` | ✅ Ya | ❌ Error |
| Dependensi eksternal (npm, library) | ❌ Zero | ✅ Ada |
| Edit tugas langsung (inline) | ✅ Ya | Jarang |
| Kalender mingguan interaktif | ✅ Ya | Jarang |

---

## Melihat Database Langsung

Karena menggunakan **IndexedDB**, Anda bisa memeriksa seluruh data tugas melalui DevTools Chrome:

1. Klik ikon ekstensi di toolbar → jendela sprespektor terbuka.
2. **Klik kanan** di dalam popup → pilih **Inspect**.
3. Di DevTools → tab **Application**.
4. Panel kiri: **Storage** → **IndexedDB** → **TodoAppDB** → **`todos`**.
5. Semua record data tugas tampil dalam bentuk tabel.

---

## Kustomisasi Tampilan

Seluruh gaya visual diatur di file [`popup.css`](popup.css). Contoh mengubah warna background:

```css
/* popup.css — baris 19 & 32 */
body {
  background-color: #0f172a; /* Dark Slate / Mode Gelap */
}
.widget-header, .filter-bar, .widget-footer {
  background: #0f172a;
}
```

**Pilihan tema:**

| Tema | Kode HEX |
| :--- | :--- |
| ☀️ Light Default | `#ffffff` |
| 🌙 Dark Slate | `#0f172a` |
| 📒 Warm Paper | `#faf7f2` |
| 💜 Pastel Lavender | `#f5f3ff` |

Baca panduan lengkap: 📄 [PANDUAN_KUSTOMISASI_STYLE.md](todo-extension-doc/PANDUAN_KUSTOMISASI_STYLE.md)

---

## Dokumentasi Teknis

| Dokumen | Isi |
| :--- | :--- |
| 📄 [MODUL_PENJELASAN_LENGKAP.md](todo-extension-doc/MODUL_PENJELASAN_LENGKAP.md) | Arsitektur, cara kerja IndexedDB mendalam, panduan migrasi database |
| 📄 [PANDUAN_KODE_DAN_ALUR_DATA.md](todo-extension-doc/PANDUAN_KODE_DAN_ALUR_DATA.md) | Bedah setiap baris kode & diagram siklus pengiriman data |
| 📄 [PANDUAN_KUSTOMISASI_STYLE.md](todo-extension-doc/PANDUAN_KUSTOMISASI_STYLE.md) | Referensi CSS lengkap & resep kustomisasi tema |
| 📄 [changelog.md](todo-extension-doc/changelog.md) | Riwayat seluruh perubahan & perbaikan bug |

---

## Lisensi

Proyek ini dilisensikan di bawah **MIT License** — bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan apapun.

---

<p align="center">
  Dibuat dengan ♥ menggunakan Vanilla JavaScript & IndexedDB — tanpa framework, tanpa server
</p>
