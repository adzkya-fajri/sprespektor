# PANDUAN LENGKAP KUSTOMISASI STYLE (CSS)
## EKSTENSI TO-DO LIST (CHROME MANIFEST V3)

Dokumen ini menjelaskan secara terperinci seluruh bagian styling antarmuka pada file [`popup.css`](file:///home/splev/Projects/UKK/popup.css): komponen apa saja yang dapat diatur, nilai-nilai properti yang bisa diubah, serta resep kode praktis untuk mengubah tema warna, ukuran, bentuk tombol, hingga mode gelap (*Dark Mode*).

---

## DAFTAR ISI
1. [Peta Bagian & Komponen yang Bisa Diubah](#1-peta-bagian--komponen-yang-bisa-diubah)
2. [Bedah Komponen CSS & Parameter yang Dapat Diatur](#2-bedah-komponen-css--parameter-yang-dapat-diatur)
   - [2.1 Ukuran Jendela & Tipografi Global](#21-ukuran-jendela--tipografi-global)
   - [2.2 Palet Warna & Desain Token](#22-palet-warna--desain-token)
   - [2.3 Header, Navigasi Tab, dan Tombol Tambah (+)](#23-header-navigasi-tab-dan-tombol-tambah-)
   - [2.4 Laci Input Tugas Baru (Expandable Drawer)](#24-laci-input-tugas-baru-expandable-drawer)
   - [2.5 Komponen Popover Shadcn/UI Date Picker](#25-komponen-popover-shadcnui-date-picker)
   - [2.6 Tombol Filter Status (Semua, Aktif, Selesai)](#26-tombol-filter-status-semua-aktif-selesai)
   - [2.7 Daftar Tugas & Kartu Tugas (Task Item)](#27-daftar-tugas--kartu-tugas-task-item)
   - [2.8 Checkbox Bulat Kustom (Circular Checkbox)](#28-checkbox-bulat-kustom-circular-checkbox)
   - [2.9 Badge Hari & Tenggat Waktu Relatif](#29-badge-hari--tenggat-waktu-relatif)
   - [2.10 Tombol Aksi Hover & Form Edit Inline](#210-tombol-aksi-hover--form-edit-inline)
   - [2.11 Tab Kalender Mingguan & Kartu Agenda](#211-tab-kalender-mingguan--kartu-agenda)
3. [Resep Kustomisasi Siap Pakai (Copy-Paste)](#3-resep-kustomisasi-siap-pakai-copy-paste)
   - [Resep 1: Mengubah Tema ke Dark Mode (Tema Gelap)](#resep-1-mengubah-tema-ke-dark-mode-tema-gelap)
   - [Resep 2: Mengganti Warna Aksen (Violet / Emerald / Rose)](#resep-2-mengganti-warna-aksen-violet--emerald--rose)
   - [Resep 3: Mengubah Checkbox Bulat Menjadi Kotak Rounded](#resep-3-mengubah-checkbox-bulat-menjadi-kotak-rounded)
   - [Resep 4: Mengubah Ukuran Popup Menjadi Lebih Lebar / Tinggi](#resep-4-mengubah-ukuran-popup-menjadi-lebih-lebar--tinggi)
   - [Resep 5: Mengubah Font ke Font Kustom (Inter / Plus Jakarta Sans)](#resep-5-mengubah-font-ke-font-kustom-inter--plus-jakarta-sans)

---

## 1. Peta Bagian & Komponen yang Bisa Diubah

Seluruh tampilan visual ekstensi diatur di satu file terpusat: [`popup.css`](file:///home/splev/Projects/UKK/popup.css). Berikut adalah pembagian area visualnya:

```text
┌──────────────────────────────────────────────────┐
│  [Task (2)]   [Calender]                 [+]     │ ➔ 1. Header & Tab (baris 38-137)
├──────────────────────────────────────────────────┤
│  [ Tulis tugas baru...                  ↵Enter ] │ ➔ 2. Drawer Input (baris 141-201)
│  [📅 Hari ini, 23 Nov                Hari ini] │ ➔ 3. Shadcn Datepicker (baris 205-412)
├──────────────────────────────────────────────────┤
│  (Semua)  (Aktif)  (Selesai)                     │ ➔ 4. Filter Bar (baris 416-448)
├──────────────────────────────────────────────────┤
│  ○  Belajar IndexedDB & CSS       [Hari ini] ✎ ✕ │ ➔ 5. Task List Item (baris 452-501)
│  ✓  Evaluasi UI/UX               [Selesai]  ✎ ✕ │    - Checkbox Bulat (baris 504-555)
│                                                  │    - Badge Hari (baris 569-608)
│                                                  │    - Edit Inline (baris 654-717)
├──────────────────────────────────────────────────┤
│  2 tugas tersisa                   Hapus selesai │ ➔ 6. Footer Bar (baris 737-762)
└──────────────────────────────────────────────────┘
```

---

## 2. Bedah Komponen CSS & Parameter yang Dapat Diatur

### 2.1 Ukuran Jendela & Tipografi Global
Diatur pada selektor `body` (baris 13–26):

```css
body {
  width: 360px;          /* Lebar popup */
  min-height: 480px;     /* Tinggi minimal popup */
  max-height: 560px;     /* Tinggi maksimal popup */
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #1e293b;
}
```

* **Lebar (`width`):** Default `360px`. Bisa diubah ke `320px` (sangat ringkas) hingga `450px` (lebar lapang).
* **Tinggi (`min-height` & `max-height`):** Default `480px` sampai `560px`. Jika diatur lebih tinggi, daftar tugas yang terlihat tanpa scroll akan lebih banyak.
* **Font (`font-family`):** Menggunakan native system fonts agar performa instan tanpa loading internet.

---

### 2.2 Palet Warna & Desain Token
Warna-warna yang digunakan mengadopsi standar Tailwind Slate/Blue:

| Peran Warna | Kode HEX Saat Ini | Lokasi Penggunaan | Rekomendasi Modifikasi |
| :--- | :--- | :--- | :--- |
| **Latar Belakang Utama** | `#ffffff` (Putih) | Background body, kartu tugas, form | `#0f172a` (Gelap) / `#fdfbf7` (Warm Paper) |
| **Latar Belakang Sekunder**| `#f8fafc` (Slate 50)| Background drawer input, hover item | `#1e293b` (Dark Slate) / `#f1f5f9` |
| **Teks Primer** | `#0f172a` (Slate 900) | Judul, tab aktif, teks input | `#f8fafc` (Putih) pada mode gelap |
| **Teks Sekunder (Muted)** | `#64748b` (Slate 500) | Tab non-aktif, tanggal, counter | `#94a3b8` |
| **Garis Batas (Border)** | `#e2e8f0` / `#f1f5f9` | Garis pemisah header, kotak input | `#334155` (Gelap) |
| **Warna Aksen Utama** | `#2563eb` (Royal Blue)| Tombol `+`, fokus input, badge hari ini| `#7c3aed` (Violet) / `#059669` (Emerald) |
| **Warna Sukses (Selesai)** | `#16a34a` (Green 600)| Checkbox saat dicentang, tombol simpan | `#10b981` (Teal Green) |
| **Warna Bahaya / Hapus** | `#ef4444` (Red 500) | Tombol batal/hapus, badge telat | `#f43f5e` (Rose) |

---

### 2.3 Header, Navigasi Tab, dan Tombol Tambah (+)
Diatur pada baris 38–137:

1. **Garis Bawah Tab Aktif (`.tab-btn.active::after`):**
   ```css
   .tab-btn.active::after {
     bottom: -2px;
     height: 2px;
     background-color: #0f172a; /* Ganti dengan warna aksen jika ingin biru/ungu */
     border-radius: 2px;
   }
   ```
2. **Badge Jumlah Tugas (`.tab-count-badge`):**
   Pill kecil penunjuk jumlah tugas aktif.
   - Background non-aktif: `#f1f5f9`, teks: `#475569`.
   - Background saat tab aktif: `#0f172a`, teks putih `#ffffff`.
3. **Tombol Plus / Batal (`.btn-toggle-add`):**
   - Ukuran: `width: 28px; height: 28px; border-radius: 6px;`
   - **Efek Rotasi:** Saat dibuka (`.active`), tombol berputar 45 derajat (`transform: rotate(45deg);`) dan berubah menjadi merah (`#ef4444`) menyerupai tanda silang penutup.

---

### 2.4 Laci Input Tugas Baru (Expandable Drawer)
Diatur pada baris 141–201:

* **Animasi Meluncur (`.expandable-drawer`):**
  Menggunakan `max-height: 0` saat tertutup dan `max-height: 380px` saat kelas `.open` ditambahkan, dengan timing kurva halus `cubic-bezier(0.16, 1, 0.3, 1)`.
* **Glow Fokus Input (`.input-row:focus-within`):**
  ```css
  .input-row:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); /* Ring glow biru lembut */
  }
  ```
* **Hint Tombol Enter (`.badge-hint-enter`):**
  Label kecil `↵ Enter` dengan font monospace di pojok kanan input.

---

### 2.5 Komponen Popover Shadcn/UI Date Picker
Diatur pada baris 205–412:

* **Kotak Mengambang (`.shadcn-popover`):**
  - Lebar: `258px`
  - Sudut lengkung: `border-radius: 8px`
  - Bayangan mengambang: `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1)`
  - Animasi muncul: `@keyframes shadcnPopFade` (memudar sambil sedikit membesar dari skala `0.98` ke `1`).
* **Sel Tanggal (`.shadcn-day-cell`):**
  - Kotak tanggal berasio persegi (`aspect-ratio: 1`).
  - **Hari Ini (`.today`):** Diberi garis batas `border: 1px solid #0f172a;`.
  - **Hari Terpilih (`.selected`):** Berlatar hitam penuh `#0f172a` dengan teks putih tebal.
* **Tombol Preset Tanggal Cepat (`.shadcn-chip`):**
  Tombol pintas di bawah grid (*Hari ini, Besok, +7 Hari*).

---

### 2.6 Tombol Filter Status (Semua, Aktif, Selesai)
Diatur pada baris 416–448:

```css
.chip-btn {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11.5px;
}
.chip-btn.active {
  background: #0f172a; /* Warna chip yang aktif */
  color: #ffffff;
}
```
* **Kustomisasi:** Anda bisa mengubah `border-radius: 6px` menjadi `border-radius: 9999px` jika menginginkan bentuk kapsul lonjong (*full capsule pills*).

---

### 2.7 Daftar Tugas & Kartu Tugas (Task Item)
Diatur pada baris 452–501:

* **Scroll Area (`.task-scroll-container`):**
  - Ketinggian maksimal: `max-height: 290px;` (bisa diperpanjang bila ingin area daftar tugas lebih lapang).
  - Scrollbar ramping kustom: lebar `5px` dengan thumb bulat `#e2e8f0`.
* **Kartu Tugas (`.task-item`):**
  - Memiliki transisi lembut saat di-hover: bergeser ke atas 1 piksel (`transform: translateY(-1px)`) dan border menjadi lebih kontras (`border-color: #e2e8f0`).
* **Teks Tugas yang Selesai (`.task-item.completed .task-text`):**
  - Dicoret: `text-decoration: line-through;`
  - Warna memudar: `color: #94a3b8;`

---

### 2.8 Checkbox Bulat Kustom (Circular Checkbox)
Diatur pada baris 504–555:

Checkbox native browser disembunyikan dan digantikan oleh lingkaran modern:
```css
.circle-checkbox-custom {
  width: 17px;
  height: 17px;
  border-radius: 50%;                 /* 50% = Bulat, ubah ke 4px jika ingin kotak */
  border: 1.5px solid #cbd5e1;
}

/* Saat aktif dicentang */
.circle-checkbox-wrapper input:checked ~ .circle-checkbox-custom {
  background-color: #16a34a;          /* Latar hijau saat selesai */
  border-color: #16a34a;
}

/* Tanda centang putih dibuat dengan garis border pseudo-element */
.circle-checkbox-custom::after {
  width: 4px;
  height: 8px;
  border: solid #ffffff;
  border-width: 0 1.8px 1.8px 0;
  transform: rotate(45deg);
}
```

---

### 2.9 Badge Hari & Tenggat Waktu Relatif
Diatur pada baris 569–608:

Setiap badge memiliki skema warna sesuai tingkat urgensi:
* **Hari ini (`.rel-today`):** Latar biru lembut `#eff6ff`, teks biru `#2563eb`.
* **Besok (`.rel-tomorrow`):** Latar hijau lembut `#f0fdf4`, teks hijau `#16a34a`.
* **Masa Depan (`.rel-future`):** Latar abu-abu `#f8fafc`, teks netral `#64748b`.
* **Terlambat / Overdue (`.rel-overdue`):** Latar merah lembut `#fef2f2`, teks merah peringatan `#dc2626`.
* **Sudah Selesai (`.rel-completed`):** Latar netral `#f1f5f9`, teks abu-abu `#94a3b8`.

---

### 2.10 Tombol Aksi Hover & Form Edit Inline
Diatur pada baris 609–717:

1. **Tombol Pensil (`.btn-edit-task`) & Hapus (`.btn-delete-task`):**
   - Secara default tersembunyi (`opacity: 0`).
   - Hanya muncul ketika kursor pengguna melayang di atas baris tugas terkait (`.task-item:hover .task-action-btns { opacity: 1; }`).
2. **Mode Edit Inline (`.task-item.is-editing`):**
   - Mengubah baris tugas menjadi kotak input aktif dengan ring biru `box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15)`.
   - Tombol simpan centang hijau (`.btn-save-edit`) dan tombol batal silang abu-abu (`.btn-cancel-edit`).

---

### 2.11 Tab Kalender Mingguan & Kartu Agenda
Diatur pada baris 766–915:

* **Grid 7 Hari (`.cal-week-grid`):**
  - Menggunakan CSS Grid 7 kolom: `grid-template-columns: repeat(7, 1fr)`.
  - Hari ini (`.active-today`): border biru menyala dengan teks tebal.
  - Hari yang dipilih (`.selected-day`): latar hitam pekat `#0f172a` dengan teks putih.
* **Kartu Agenda Harian (`.agenda-item-card`):**
  - Kartu ringkas daftar tugas terjadwal pada tanggal yang sedang dipilih.

---

## 3. Resep Kustomisasi Siap Pakai (Copy-Paste)

Berikut adalah panduan praktis untuk mengubah gaya tampilan sesuai selera Anda:

### Resep 1: Mengubah Tema ke Dark Mode (Tema Gelap)
Tambahkan blok kode berikut di akhir file `popup.css` atau gunakan CSS media query:

```css
@media (prefers-color-scheme: dark) {
  body, .todo-popup-card, .widget-header, .filter-bar, .widget-footer {
    background-color: #090d16 !important;
    color: #f1f5f9 !important;
  }
  
  .widget-header, .widget-footer, .filter-bar {
    border-color: #1e293b !important;
  }

  .tab-btn {
    color: #94a3b8 !important;
  }
  .tab-btn.active {
    color: #ffffff !important;
  }
  .tab-btn.active::after {
    background-color: #3b82f6 !important;
  }

  .expandable-drawer {
    background: #0f172a !important;
    border-color: #1e293b !important;
  }

  .input-row, .shadcn-date-trigger {
    background: #1e293b !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  .input-row input[type="text"] {
    color: #f8fafc !important;
  }

  .task-item {
    background: #0f172a !important;
    border-color: #1e293b !important;
  }
  .task-item:hover {
    background: #1e293b !important;
    border-color: #334155 !important;
  }
  .task-text {
    color: #f1f5f9 !important;
  }

  .shadcn-popover {
    background: #0f172a !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }
  .shadcn-month-title {
    color: #f8fafc !important;
  }
  .shadcn-day-cell {
    color: #cbd5e1 !important;
  }
  .shadcn-day-cell:hover:not(.outside) {
    background-color: #1e293b !important;
  }
}
```

---

### Resep 2: Mengganti Warna Aksen (Violet / Emerald / Rose)
Jika Anda ingin mengganti aksen warna dari **Biru** ke **Ungu (Violet)**:

Di baris 112, 126, 173, 533, 581, 640 pada `popup.css`, ganti kode warna `#2563eb` menjadi:
* **Violet (Ungu Elegan):** `#7c3aed` (Latar hover: `#f5f3ff`, border: `#ddd6fe`)
* **Emerald (Hijau Modern):** `#059669` (Latar hover: `#ecfdf5`, border: `#a7f3d0`)
* **Rose (Merah Muda Mewah):** `#e11d48` (Latar hover: `#fff1f2`, border: `#fecdd3`)
* **Minimalist Monochrome (Hitam Pekat):** `#09090b`

---

### Resep 3: Mengubah Checkbox Bulat Menjadi Kotak Rounded
Jika Anda lebih menyukai tampilan checkbox kotak melengkung bergaya iOS/macOS:

Cukup ubah kelas `.circle-checkbox-custom` di baris **521–530**:
```css
/* UBAH BARIS 525 DARI: */
border-radius: 50%;

/* MENJADI: */
border-radius: 4px;
```

---

### Resep 4: Mengubah Ukuran Popup Menjadi Lebih Lebar / Tinggi
Jika layar Anda beresolusi tinggi dan ingin popup yang lebih lega:

Ubah baris **14–16** pada `body`:
```css
body {
  width: 420px;          /* Diubah dari 360px menjadi 420px */
  min-height: 540px;     /* Diubah dari 480px menjadi 540px */
  max-height: 620px;     /* Diubah dari 560px menjadi 620px */
}
```
Dan sesuaikan ketinggian scroll area pada `.task-scroll-container` (baris 453):
```css
.task-scroll-container {
  max-height: 360px;     /* Diubah dari 290px menjadi 360px */
}
```

---

### Resep 5: Mengubah Font ke Font Kustom (Inter / Plus Jakarta Sans)
Anda bisa memasukkan import font Google Fonts di baris paling atas `popup.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

body {
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  /* ... */
}
```

---

## 4. Kesimpulan
Semua aspek visual di ekstensi ini dirancang secara modular dan berbasis kelas CSS standar. Anda dapat melakukan kustomisasi tanpa risiko merusak logika fungsional JavaScript atau database IndexedDB.
