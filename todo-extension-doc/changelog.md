# Changelog: Overlay Drawer To-Do List Extension

Seluruh histori perubahan, keputusan arsitektur, dan penambahan fitur dicatat secara kronologis dalam dokumen ini sesuai standar rekayasa.

---

## [2026-11-09] - Eksplorasi & Evolusi UX (4 Pola Tata Letak Interaktif)

### Masukan Pengguna (User Request)
- Pengguna memberikan arahan: *"desain nya ux nya juga boleh dirubah"*.
- Mengidentifikasi kelemahan pada wireframe awal (seperti tab "New Task" terpisah yang menambah klik/frictional cost, serta tab "Calender" yang belum terintegrasi fungsional dengan daftar tugas).

### Ditambahkan & Ditingkatkan (Added & Enhanced)
- Menghadirkan **4 Pola Struktur UX (UX Layout Paradigms)** yang dapat diuji dan dialihkan secara langsung di browser:
  1. **UX 1: Instant Inline (Gaya Things 3 / Linear):** Input langsung di atas daftar tugas (zero-friction), filter chip status (Semua/Aktif/Selesai), progress counter terintegrasi.
  2. **UX 2: Integrated Calendar & Task Strip (Gaya Apple / Notion):** Kalender mingguan interaktif di bagian atas yang terhubung langsung dengan penyaringan tugas harian di bawahnya.
  3. **UX 3: Refined 3-Tab (Sesuai Wireframe Awal):** Mempertahankan struktur 3 tab (`Task`, `Calender`, `New Task`) namun dengan transisi mulus, inline quick-add, dan micro-interactions yang rapi.
  4. **UX 4: Compact Focus Capsule (Gaya Raycast):** Format ultra-kompak dengan tombol `+` cepat, progress dot, dan keyboard-first workflow.
- Seluruh ke-4 pola UX ini dapat dipadukan secara bebas dengan **30 Preset Desain Minimalis Terang** di halaman preview interaktif `prototypes-preview.html`.

---

## [2026-11-09] - Eksplorasi 30 Desain Minimalis Terang (Light Mode UX)

### Masukan & Referensi Pengguna (User Input & UX Wireframe)
- Pengguna memberikan referensi screenshot UX (`uploaded_media_*.jpg`):
  - Form factor: **Floating Widget Card** di pojok kanan atas layar browser (tepat di bawah toolbar ekstensi).
  - Navigasi Header: Logo/icon brand di kiri, diikuti 3 tab: `Task`, `Calender`, `New Task`. Tab aktif ditandai dengan garis bawah horizontal (*clean underline indicator*).
  - Item Tugas: Checkbox melingkar (*circular radio-style checkbox*), teks tugas, dan garis pemisah horizontal (*divider line*).
  - Permintaan Arah Desain: Beralih dari Dark Mode ke **Desain Minimalis Terang (Light Mode)** yang menarik dan modern dengan mengambil referensi dari X/Twitter, media sosial, dan platform produktivitas web kelas dunia.
  - Deliverable: Membangun katalog **30 Desain Minimalis Terang** yang berbeda dan dapat diuji/dilihat langsung di browser.

### Ditambahkan (Added)
- Halaman katalog showcase komprehensif `todo-extension-doc/prototypes-preview.html` diperbarui total:
  - **30 Variasi Desain Minimalis Terang Lengkap** berbasis referensi nyata (Things 3, Notion, Linear, Apple Reminders, Craft.do, Bear, X/Twitter, Raycast, Muji, Swiss Grid, Stripe, Vercel/Geist, Arc, GitHub, Todoist, Monocle, Neo-Brutalism, Nordic Hygge, Substack, Superhuman, Frosted Glass Light, Ink Monochrome, Sage Pastel, Warm Sand, Lavender, Blueprint, Obsidian, Medium, Wireframe, Floating Island).
  - **Mode Tampilan Ganda:**
    1. *Mode Live Browser (In-Situ):* Menampilkan widget melayang persis di pojok kanan atas browser di atas simulasi Google New Tab / web aktif, persis seperti screenshot pengguna.
    2. *Mode Galeri Grid (30 Desain):* Menampilkan ke-30 kartu desain secara berdampingan untuk memudahkan perbandingan visual.
  - **Fungsionalitas Interaktif Penuh:**
    - Tab `Task`: Daftar tugas interaktif dengan checkbox lingkaran, animasi coret, dan tombol hapus.
    - Tab `Calender`: Tampilan agenda kalender minimalis.
    - Tab `New Task`: Input cepat untuk menambahkan tugas baru secara instan.
    - Filter kategori desain: *Semua*, *Productivity Giants*, *Clean Paper & Editorial*, *Modern Tech*, *Aesthetic Colors*.

---

## [2026-11-09] - Inisiasi Proyek & Prototipe Visual

### Ditambahkan (Added)
- Struktur dokumentasi awal proyek (`todo-extension-doc/`):
  - `architecture.md`: Dokumen arsitektur sistem, peta indeks file, dan diagram alur runtime.
  - `frontend.md`: Spesifikasi antarmuka, struktur hierarki Shadow DOM, dan desain sistem.
  - `backend.md`: Spesifikasi background service worker, skema data `chrome.storage.local`, dan protokol runtime messaging.
  - `changelog.md`: Dokumen histori pembaruan proyek.
  - `prototypes-preview.html`: Halaman preview interaktif di browser untuk mengevaluasi 3 variasi desain prototipe.
- Inisialisasi repositori Git mandiri di direktori proyek `/home/splev/Projects/UKK`.

### Keputusan Desain & Arsitektur (Architectural Decisions)
- **Perubahan UI Docking:** Beralih dari native `chrome.sidePanel` ke **In-Page Overlay Drawer (Content Script + Shadow DOM)** atas permintaan pengguna agar tampilan ekstensi dapat melayang dan menimpa konten halaman web secara langsung.
- **Penyediaan 3 Opsi Prototipe Visual:**
  1. *Option 1 - Modern Slate Card Deck:* Kontras solid (#0f172a / #1e293b / #3b82f6), kartu tugas terstruktur, chip filter dinamis.
  2. *Option 2 - Translucent Frosted Glass:* Efek glassmorphism semi-transparan dengan backdrop blur dan border halus.
  3. *Option 3 - Raycast / Linear Minimalist:* Gaya obsidian gelap (#090d16), densitas tinggi, pemisah garis tipis, dan micro-badges.
