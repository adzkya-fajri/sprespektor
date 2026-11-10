# Changelog: Overlay Drawer To-Do List Extension

Seluruh histori perubahan, keputusan arsitektur, dan penambahan fitur dicatat secara kronologis dalam dokumen ini sesuai standar rekayasa.

---

## [2026-11-10] - Integrasi Komponen Date Picker Berbasis Desain Shadcn/UI & Perbaikan Injeksi Content Script

### Masukan Pengguna (User Request)
1. Analisis & perbaikan kendala: `console.error("Gagal menginjeksi content script:", injectError);`.
2. Penerapan desain komponen: *"pakai ini saja https://ui.shadcn.com/docs/components/date-picker"*.

### Investigasi Akar Masalah & Perbaikan (Root Cause & Fix)
- **Akar Masalah Utama:** Variabel `todayDateStr` digunakan pada baris awal deklarasi `state` di `content_script.js` sebelum baris deklarasi `const todayDateStr` dieksekusi (Temporal Dead Zone / `ReferenceError`), menyebabkan script gagal di-parse oleh runtime browser saat diinjeksi via `chrome.scripting.executeScript`.
- **Perbaikan Injeksi:**
  - Memindahkan inisialisasi `todayDateStr` ke lingkup teratas di dalam IIFE sebelum inisialisasi objek `state`.
  - Memperkuat filter URL di `background.js` agar memvalidasi URL internal browser (`chrome://`, `chrome-extension://`, `about:`, `view-source:`, dan `chromewebstore.google.com`) dan memberikan pesan peringatan yang informatif.

### Penerapan Komponen Shadcn/UI Date Picker
- **Trigger Button (`.shadcn-date-trigger`):**
  - Desain *outline button* presisi sesuai standar `ui.shadcn.com`: border 1px `#e2e8f0`, background putih, rounded corners 6px, ikon kalender SVG minimalis di sisi kiri.
  - Menampilkan label tanggal terformat (misal: `"10 Nov 2026"`) dan badge status hari relatif dinamis (`Hari ini`, `Besok`, `+N hr`).
- **Floating Popover Calendar (`.shadcn-popover`):**
  - Kotak popover melayang dengan bayangan halus (*box-shadow drop*), border 1px zinc/slate, z-index teratas.
  - Header navigasi bulan dengan tombol panah (Prev/Next) untuk menjelajah bulan.
  - Grid 7 hari kalender lengkap (`Min`, `Sen`, `Sel`, `Rab`, `Kam`, `Jum`, `Sab`) dengan seleksi tanggal visual:
    - Tanggal terpilih: latar gelap `#0f172a` dengan teks putih (aksen khas Shadcn).
    - Hari ini: garis tepi halus penanda hari ini.
    - Tanggal di luar bulan aktif: warna muted/abu-abu halus.
- **Shortcut Presets Bar:**
  - Chip instan di bagian bawah popover: **"Hari ini"**, **"Besok"**, dan **"+7 Hari"** untuk input satu kali klik.
  - Otomatis menutup popover saat tanggal dipilih atau pengguna mengklik di luar area popover.
- **Sinkronisasi Kode:** Diterapkan identik pada `content_script.js`, `widget.css`, dan live preview `todo-extension-doc/prototypes-preview.html`.

## [2026-11-10] - Penghapusan Ikon Logo "▲" untuk Estetika Ultra-Minimalis

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"untuk bagian ▲ kita hapus saja"*.
- Perubahan yang diterapkan:
  - Menghapus elemen icon logo `▲` dari header widget.
  - Header kini menampilkan langsung navigasi tab (**`Task 2`** dan **`Calender`**) di sisi kiri dan tombol **`+`** di sisi kanan, memberikan tampilan yang jauh lebih bersih, modern, dan luas.

---

## [2026-11-10] - Kalender Interaktif Penuh (Klik Tanggal, Navigasi Minggu & Filter Agenda)

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"untuk bagian dibagian calender belum bisa di klik"*.
- Perbaikan & Peningkatan:
  1. **Event Listener Klik Sel Tanggal (`cal-day-cell`):**
     - Setiap sel tanggal kini interaktif: saat diklik, sel tanggal menjadi aktif (*highlighted*).
     - Daftar agenda di bawah otomatis menyaring dan menampilkan tugas khusus untuk tanggal yang diklik tersebut.
     - Menyediakan *empty state* yang informatif jika tanggal yang dipilih belum memiliki tugas, lengkap dengan tombol langsung tambah tugas.
  2. **Navigasi Minggu (Previous `◀` / Next `▶`):**
     - Menyematkan tombol navigasi minggu di header kalender untuk berpindah antar-minggu dalam bulan ini atau bulan lainnya.
  3. **Sinkronisasi Otomatis dengan Form Tambah (`+`):**
     - Saat sebuah tanggal dipilih di kalender, nilai input `<input type="date">` pada form `+` otomatis terisi dengan tanggal tersebut.

---

## [2026-11-10] - Rilis Kode Lengkap Ekstensi Chrome Manifest V3 (Unpacked Ready)

### Ditambahkan (Added)
- Menyusun seluruh file sumber ekstensi Chrome Manifest V3 secara utuh tanpa potongan:
  - `manifest.json`: Manifest V3 resmi dengan permission `storage`, `activeTab`, `scripting`, background service worker, content script, dan web accessible resources.
  - `background.js`: Service worker penangan aksi klik toolbar browser dan pembaruan badge counter real-time.
  - `db.js`: Modul IndexedDB wrapper `TodoDatabase` (Promise-based) dengan skema Object Store `todos` & `settings` serta pengindeksan `idx_dueDate`, `idx_completed`, `idx_createdAt`.
  - `content_script.js`: Injeksi UI melayang ke tab aktif menggunakan **Shadow DOM**, kalkulasi hari relatif presisi (`-9 hr`, `Hari ini`, `Besok`, `+N hr`), rendering kalender, dan isolasi penuh dari CSS website host.
  - `widget.css`: Styling modern Light Minimalist lengkap dengan perataan simetris header (Logo ▲, `Task 2`, `Calender`, `+`), form input expandable, circular checkbox, dan animasi transisi halus.
  - `icons/`: Icon resmi ekstensi beresolusi 16x16, 48x48, dan 128x128 piksel (`icon16.png`, `icon48.png`, `icon128.png`).

---

## [2026-11-10] - Penetapan Arsitektur Database: IndexedDB Native Engine

### Keputusan Arsitektur (Architectural Decision)
- Pengguna menetapkan pilihan basis data: **IndexedDB Native Browser Engine**.
- Menghindari keterbatasan kuota dan struktur `localStorage`, serta menjaga ekstensi tetap portabel tanpa mewajibkan pengguna menginstal atau menyalakan server eksternal.

### Spesifikasi Skema IndexedDB Ditetapkan:
- **Nama Database:** `TodoAppDB` (Versi 1)
- **Object Store 1: `todos`** (Primary Key: `id`):
  - Indeks 1: `idx_dueDate` (Query & sorting tanggal/kalender, `IDBKeyRange`)
  - Indeks 2: `idx_completed` (Filter cepat aktif vs selesai)
  - Indeks 3: `idx_createdAt` (Pengurutan kronologis pembuatan)
- **Object Store 2: `settings`** (Primary Key: `key`):
  - Menyimpan preferensi pengguna (tema terpilih, status filter, dll.)
- **Modul Pembantu (Helper Class):** `IDBManager` yang membungkus IndexedDB berbasis *Promise (async/await)* untuk operasi CRUD yang bersih dan bebas *callback hell*.

---

## [2026-11-10] - Diskusi Arsitektur Database: Migrasi dari LocalStorage

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"untuk database saya tidak ingin yang localstorage"*.
- Menginisiasi eksplorasi alternatif arsitektur penyimpanan data di luar `localStorage` / `chrome.storage.local`:
  1. **IndexedDB:** Database transaksional terstruktur native di browser dengan indexing, cursor, dan kapasitas tak terbatas tanpa perlu menyalakan server backend.
  2. **External Backend API + SQLite/PostgreSQL:** Ekstensi terhubung ke server API lokal/remote (Node.js/Python) yang menyimpan data ke basis data relasional fisik (`todos.db`).
  3. **Cloud BaaS (Supabase / Firebase):** Sinkronisasi database cloud real-time multi-device.

---

## [2026-11-10] - Dokumentasi Komprehensif Struktur Database & Model Data

### Dokumentasi & Penjelasan (Documentation Update)
- Menjabarkan secara lengkap struktur basis data lokal berbasis `chrome.storage.local`:
  - Definisi antarmuka TypeScript untuk `TodoItem`, `UserSettings`, dan `StorageSchema`.
  - Spesifikasi field `dueDate` berformat ISO 8601 (`YYYY-MM-DD`) untuk mendukung penjadwalan presisi.
  - Dokumentasi mekanisme komputasi dinamis hari relatif di sisi klien (badge `-9 hr`, `Hari ini`, `Besok`, `+N hr` dihitung *on-the-fly* tanpa membebani storage).
  - Alur siklus hidup operasi CRUD (Create, Read, Update, Delete) dan sinkronisasi multi-tab.

---

## [2026-11-09] - Input Tanggal Akurat (Native Calendar Date Picker)

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"untuk waktunya itu di tentukan dengan mengimput tanggal agar waktunya akurat"*.
- Fitur yang dibangun:
  1. **Input Tanggal Kalender Akurat (Exact Date Picker):**
     - Mengganti estimasi minggu dengan komponen input tanggal presisi (`<input type="date">`) yang didesain minimalis dan menyatu dengan tema.
     - Default terisi otomatis dengan tanggal hari ini.
     - Pengguna dapat memilih tanggal spesifik apa pun (baik dalam bulan ini maupun bulan lainnya) secara akurat melalui kalender pop-up native.
  2. **Kalkulasi Hari Relatif Presisi:**
     - Selisih hari dihitung secara matematis berdasarkan selang waktu 24 jam antara tanggal kalender yang diinput dengan hari ini.
     - Menghasilkan badge akurat: `Hari ini`, `Besok`, `+N hr`, atau `-N hr` (misal: `-9 hr`).

---

## [2026-11-09] - Fitur Penjadwalan Waktu & Badge Hari Relatif (-9 hr / Hari ini)

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"untuk bagian tambah nya bisa menentukan waktu juga, dengan beberapa minggu dalam bulan ini, dan untuk bagian yang di samping ini mengikuti hari misal -9 hr atau hari ini"*.
- Fitur yang dibangun:
  1. **Pemilihan Waktu & Minggu pada Form Tambah Tugas:**
     - Pada form expandable `+`, disediakan pemilih tanggal/minggu instan (*quick date chips: Hari ini, Besok, Minggu 1–4 bulan ini*) serta input tanggal kustom.
  2. **Badge Hari Relatif Dinamis (Relative Days Counter):**
     - Badge di samping kanan teks tugas kini menghitung selisih hari secara real-time terhadap hari ini:
       - Hari ini: `Hari ini`
       - Besok: `Besok`
       - Masa depan: `+N hr` (misal: `+3 hr`)
       - Terlewat / Overdue: `-N hr` (misal: `-9 hr` dengan aksen merah/peringatan)
     - Menggantikan label statis sebelumnya dengan indikator tenggat waktu yang cerdas dan fungsional.

---

## [2026-11-09] - Penyempurnaan Header: Penghapusan Tombol "✕" & Perataan Visual Tab

### Masukan Pengguna (User Request)
- Evaluasi visual berbasis tangkapan layar anotasi: *"bagian hijau diratakan dan bagian merah di hilangkan"*.
- Perubahan yang diterapkan:
  1. **Menghilangkan Tombol Tutup "✕" (Bagian Merah):** Tombol `✕` di pojok kanan atas resmi dihapus agar header tampil jauh lebih bersih, ringkas, dan fokus. Penutupan panel dapat dilakukan via klik ikon toolbar browser, klik di luar widget, atau tombol keyboard `Esc`.
  2. **Perataan Sempurna Elemen Header (Bagian Hijau):**
     - Menyelaraskan *vertical baseline* dan *horizontal alignment* antara logo brand (▲), navigasi tab (`Task 2`, `Calender`), dan tombol action `+`.
     - Distribusi jarak (*spacing & balance*) ditata ulang secara proporsional dan rata tengah simetris.

---

## [2026-11-09] - Penyempurnaan UX: Tombol "+" Toggle Input & Penghapusan Badge "50% Selesai"

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"untuk bagian New Task kita buat akan muncul untuk bagian isian nya ketika tombol + di tekan dan untuk bagian 50% selesai kita hapus"*.
- Perubahan yang diterapkan:
  1. **Menghapus Badge Progres "50% Selesai":** Header menjadi jauh lebih bersih, minimalis, dan tidak terdistraksi elemen statistik yang berlebihan.
  2. **Interaksi Expandable Input via Tombol "+":**
     - Menyematkan tombol icon `+` modern di header (di samping tombol tutup `✕`).
     - Input field tersembunyi secara default untuk memaksimalkan ruang tampilan tugas.
     - Saat tombol `+` diklik, bar input meluncur turun (*smooth slide-down*) dengan fokus kursor otomatis (*autofocus*).
     - Menekan tombol `Enter` menyimpan tugas, dan menekan `Esc` atau tombol `+` lagi menutup form input.

---

## [2026-11-09] - Penyempurnaan UX 3: Eliminasi Tab "New Task" & Peningkatan Kepadatan Visual

### Masukan Pengguna (User Feedback)
- Evaluasi pengguna: *"yang ux 3 lumayan tapi terlihat sepi dan untuk New Task kita hapus"*.
- Keputusan UX:
  1. **Menghapus Tab "New Task"**: Alur penambahan tugas dipindahkan menjadi *inline quick-add input* langsung di dalam tab `Task` (cukup ketik lalu tekan `Enter`).
  2. **Menghilangkan Kesan "Sepi" (Visual Enrichment & Life):**
     - Menambahkan indikator progres harian visual (*progress meter / completion ring* `2/4 selesai`).
     - Menyematkan filter chip status (*Semua*, *Aktif*, *Selesai*).
     - Menambahkan tag konteks/waktu opsional pada item tugas (*Hari ini*, *Penting*).
     - Memperkaya tab `Calender` dengan visual mini kalender tanggal & timeline agenda yang fungsional.
     - Menghadirkan micro-interactions, badge counter pada tab `Task (2)`, dan footer ringkas.

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
