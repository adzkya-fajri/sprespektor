# Changelog: Overlay Drawer To-Do List Extension

Seluruh histori perubahan, keputusan arsitektur, dan penambahan fitur dicatat secara kronologis dalam dokumen ini sesuai standar rekayasa.

---

## [2026-11-10] - Penambahan Fitur Edit Tugas (Inline Quick Edit & Tombol Pensil ✎) dan Perbaikan Port Message

### Masukan Pengguna (User Request)
1. *"kita tambahkan tombol untuk mengedit task"*
2. Laporan baris error: `background.js:68 (anonymous function)`

### Analisa & Solusi
1. **Perbaikan Port Message `background.js`:**
   - Pada baris penangan pesan `UPDATE_BADGE`, respons sinkron `sendResponse({ success: true })` sebelumnya mengembalikan nilai `return true` yang membuat Chrome menahan koneksi port menunggu respons asinkron yang tidak pernah datang (*The message port closed before a response was received*).
   - Diperbaiki dengan mengembalikan `return false` untuk menutup port segera setelah pesan sinkron diproses.
2. **Fitur Edit Tugas (Inline Quick Edit):**
   - Menambahkan tombol edit pensil **`✎`** di samping tombol hapus **`✕`** pada setiap baris tugas (tampil halus saat hover).
   - Pengguna juga dapat mengklik dua kali (**double-click**) pada teks tugas untuk langsung masuk ke mode edit.
   - Kolom teks langsung berubah menjadi input aktif dengan fokus otomatis.
   - Tekan **Enter** (atau klik tombol **`✓`**) untuk menyimpan perubahan ke basis data **IndexedDB**.
   - Tekan **Esc** (atau klik tombol **`✕`**) untuk membatalkan pengeditan.

---

## [2026-11-10] - Implementasi Resmi Standar Action Popup (Mempertahankan 100% Desain & UX Kartu)

### Masukan Pengguna (User Request)
- Persetujuan pengguna: *"oke, karena dilarang kita pakai yang biasa saja, tapi untuk ux nya jika bisa di pertahankan, hanya posisinya saja"*.
- Mengalihkan arsitektur ke standar resmi Chrome Action Popup (`default_popup: "popup.html"`), dengan syarat:
  - **Seluruh UX dipertahankan 100%**: Tabs `Task` & `Calender`, tombol `+` dengan animasi rotasi, expandable form drawer, tombol input tanggal **Shadcn/UI Date Picker**, checkbox bulat (*circular checkbox*), lencana hari relatif dinamis, dan basis data **IndexedDB**.
  - **Hanya posisinya yang berpindah**: Dari melayang di dalam halaman web menjadi muncul langsung di bawah ikon toolbar saat diklik.

### Hasil Rekayasa
1. `manifest.json`: Menggunakan `"default_popup": "popup.html"` resmi.
2. `popup.html`: Memuat struktur kartu To-Do List yang sama persis tanpa banner atau elemen luar yang mengganggu.
3. `popup.css`: Mempertahankan 100% styling Light Minimalist, font, warna, border, dan interaksi.
4. `popup.js`: Menyambungkan langsung ke `db.js` (IndexedDB `TodoAppDB`), Shadcn/ui Date Picker popover, agenda kalender mingguan interaktif, dan penghitung badge toolbar Chrome.
5. **Keuntungan:** Berfungsi mulus di semua tab (termasuk `chrome://extensions` dan `chrome://newtab`) tanpa peringatan `!`, tanpa error, dan tanpa membuka tab baru.

---

## [2026-11-10] - Penghapusan Total Pembuatan Tab Baru (Strict Zero New Tab Policy)

### Masukan Pengguna (User Request)
- Evaluasi & pertanyaan pengguna: *"mengapa selalu menggunakan tab baru?"*.
- Konfirmasi kebutuhan: Pengguna tidak ingin ekstensi membuka tab baru sama sekali. Pengguna ingin widget overlay muncul langsung di halaman aktif saat ikon toolbar diklik.

### Analisa & Tindakan Rekayasa
- **Akar Masalah:** Di file `background.js`, terdapat baris `chrome.tabs.create(...)` yang memicu pembukaan tab baru jika ekstensi diklik saat pengguna sedang berada di tab `chrome://extensions`.
- **Perbaikan:**
  1. Menghapus seluruh pemanggilan `chrome.tabs.create(...)` dari `background.js`.
  2. Menghapus file `app.html`.
  3. Ekstensi kini **100% TIDAK PERNAH membuka tab baru**.
  4. Ketika diklik di halaman web biasa, widget overlay langsung muncul meluncur di pojok kanan atas halaman aktif.
  5. Jika pengguna tidak sengaja mengeklik saat berada di tab `chrome://`, ekstensi hanya memberikan indikasi lencana badge merah **`!`** selama 3 detik tanpa pernah membuka tab baru.

---

## [2026-11-10] - Restorasi Penuh UI/UX Floating In-Page Overlay Widget (Shadow DOM) & Penghapusan Total Localhost

### Masukan Pengguna (User Request)
- Evaluasi pengguna: *"lah ui ux nya kenapa berubah?"*.
- Klarifikasi kebutuhan: Pengguna menginginkan antarmuka asli berupa **In-Page Floating Overlay Widget** yang melayang di pojok kanan layar website (Shadow DOM), bukan popup toolbar kecil, dan tanpa membuka server eksternal `localhost:3333`.

### Tindakan Rekayasa & Solusi
1. **Mengembalikan Format Floating Overlay (Shadow DOM):**
   - Mengembalikan arsitektur `content_script.js` dan `widget.css` sebagai antarmuka utama.
   - Widget kembali melayang di pojok kanan atas halaman (`top: 16px; right: 20px;`) dengan animasi *slide down*, dual tab (**`Task`** dan **`Calender`**), expandable drawer **`+`**, tombol input tanggal **Shadcn/UI Date Picker**, dan checkbox bulat.
2. **Penghapusan Total Ketergantungan Localhost (`localhost:3333`):**
   - Tidak ada lagi server lokal atau port 3333 yang dijalankan.
   - Jika pengguna mengeklik ikon toolbar saat berada di tab internal browser yang tidak mengizinkan injeksi (seperti `chrome://extensions`), ekstensi membuka halaman mandiri internal ekstensi: `chrome-extension://<id>/app.html`.
   - Halaman `app.html` berjalan 100% offline dan native di dalam browser Chrome tanpa membutuhkan server apa pun.

---

## [2026-11-10] - Migrasi Arsitektur Penuh ke Native Chrome Action Popup (Bebas Localhost 100%)

### Masukan Pengguna (User Request)
- Evaluasi & instruksi pengguna: *"lah masih muncul ke halaman http://localhost:3333/prototypes-preview.html, mengapa ini bisa terjadi, tolong di analisa agar hanya membuka extention nya saja tanpa local host"*.

### Analisa Akar Masalah (Root Cause Analysis)
1. **Ketergantungan Ekstensi Sebelumnya:** Ekstensi awalnya dirancang menggunakan model *in-page content script injection*. Saat pengguna mengklik toolbar icon pada tab internal seperti `chrome://extensions` (di mana injeksi content script diblokir oleh Chromium), skrip `background.js` secara otomatis membuka URL tab baru ke `http://localhost:3333/prototypes-preview.html`.
2. **Kelemahan Model Tersebut:** Ekstensi Chrome yang berkualitas tinggi seharusnya **100% mandiri (*self-contained*), offline, dan tidak boleh bergantung pada server lokal (`localhost:3333`)** ataupun membuka tab web baru saat ikon toolbar diklik.

### Solusi Arsitektur Standar Manifest V3
1. **Adopsi Native Chrome Action Popup (`default_popup: "popup.html"`):**
   - Mengubah deklarasi di `manifest.json`: menambahkan `"default_popup": "popup.html"`.
   - Mengeliminasi kebutuhan permission `"activeTab"` dan `"scripting"` yang rawan konflik keamanan URL.
2. **Implementasi Jendela Popup Ekstensi Mandiri:**
   - `popup.html`: Memuat antarmuka To-Do List modern secara utuh di dalam jendela popup Chrome native (Width 370px, Height ~520px).
   - `popup.css`: Styling modern Light Minimalist yang dirancang khusus untuk container popup extension.
   - `popup.js`: Menghubungkan antarmuka secara langsung ke basis data **IndexedDB (`TodoAppDB`)**, mendukung dual tab (`Task 2`, `Calender`), form expandable `+`, dan komponen kalender melayang **Shadcn/UI Date Picker**.
3. **Hasil & Keuntungan:**
   - **Bebas Localhost:** Tidak memerlukan server terminal apa pun (`http://localhost:3333` dihapus total).
   - **Bisa Dibuka di Tab Mana Pun:** Berfungsi normal di halaman `chrome://extensions`, `chrome://newtab`, `https://google.com`, dokumen PDF, maupun saat offline.
   - **Bebas Error URL Security:** Tidak ada lagi error `Cannot access a chrome:// URL`.
   - **IndexedDB Asli:** Data tersimpan permanen di sandbox penyimpanan native ekstensi (`chrome-extension://`).

---

## [2026-11-10] - Auto-Fallback Buka Tab To-Do saat Diklik di Halaman Internal (chrome://)

### Peningkatan UX (User Experience Improvement)
- Menambahkan fallback otomatis: jika ekstensi diklik pada tab internal browser (`chrome://extensions`, `chrome://newtab`, dll.) yang dibatasi oleh Chromium, ekstensi tidak memunculkan error melainkan langsung membuka halaman aplikasi To-Do lokal (`http://localhost:3333/prototypes-preview.html`) di tab baru secara mulus.

---

## [2026-11-10] - Pencegahan & Penanganan Error Akses Halaman Internal Browser (chrome://)

### Masukan Pengguna (User Request)
- Error saat ekstensi diklik pada tab internal: `Gagal menginjeksi content script: Error: Cannot access a chrome:// URL`.

### Akar Masalah & Kebijakan Browser (Root Cause & Policy)
- Google Chrome memberlakukan kebijakan keamanan mutlak (**Chromium Security Sandbox Policy**) di mana ekstensi peramban dilarang keras membaca atau menginjeksi skrip ke halaman sistem internal browser (`chrome://extensions`, `chrome://newtab`, `chrome://settings`, dll.).
- Tanpa izin `tabs`, properti `tab.url` disembunyikan / bernilai `undefined` oleh browser pada halaman internal, sehingga verifikasi URL sebelumnya tidak terpicu.

### Solusi & Peningkatan Visual
1. **Validasi URL Komprehensif di `background.js`:**
   - Memeriksa `tab.url` maupun `tab.pendingUrl`. Jika kosong/undefined atau mengarah ke skema `chrome://`, `chrome-extension://`, `about:`, atau `devtools://`, injeksi dibatalkan secara aman tanpa memicu crash console.
2. **Indikator Visual Badge Kustom (`!`):**
   - Jika pengguna tidak sengaja mengeklik ikon ekstensi saat berada di tab `chrome://`, ekstensi kini menampilkan lencana badge berwarna merah **`!`** dengan tooltip peringatan yang menjelaskan bahwa ekstensi harus dibuka di tab web biasa, dan otomatis di-reset setelah 3.5 detik.

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
