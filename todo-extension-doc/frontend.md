# Rancangan Front-End: Floating Widget To-Do List (Light Minimalist)

## 1. Evolusi Konsep & 4 Pola Struktur UX (UX Layout Paradigms)

Atas arahan pengguna bahwa UX dapat diubah dan dioptimalkan, kami merancang 4 paradigma struktur UX yang mengatasi kekurangan pada wireframe awal (seperti memisahkan pembuatan tugas ke tab berbeda yang memperlambat alur kerja):

### 1.1. Pola UX 1: Instant Inline (Direkomendasikan - Gaya Things 3 & Linear)
- **Karakter Alur Kerja:** *Zero-Friction Productivity*.
- **Komponen:**
  - Header: Logo brand + *progress meter* dinamis (`2 tersisa`) + tombol tutup.
  - Input Section: Input bar instan langsung di bawah header (*"Tulis tugas baru lalu Enter..."*). Pengguna tidak perlu membuka tab baru hanya untuk mengetik.
  - Filter Bar: Segmented filter chips (*Semua*, *Aktif*, *Selesai*).
  - Task List: Checkbox melingkar, teks tugas, tombol hapus halus saat hover.

### 1.2. Pola UX 2: Integrated Calendar & Task Strip (Gaya Apple Reminders & Notion)
- **Karakter Alur Kerja:** Mengintegrasikan permintaan "Calender" secara fungsional.
- **Komponen:**
  - Bagian Atas: *Mini Date Strip* mingguan horizontal (Senin - Minggu) dengan indikator dot hari ini. Mengklik hari otomatis memfilter tugas untuk tanggal tersebut.
  - Bagian Bawah: Daftar tugas untuk tanggal yang dipilih + input cepat.

### 1.3. Pola UX 3: Refined Dual-Tab (Task & Calender - Terpilih & Disempurnakan)
- **Karakter Alur Kerja:** Menggabungkan kesederhanaan wireframe pengguna dengan kepadatan informasi produktivitas yang dinamis dan hidup (tidak terasa sepi).
- **Struktur Header Simetris & Rata (Aligned Layout):**
  - Kiri: Logo brand (▲) yang sejajar vertikal secara presisi dengan teks tab.
  - Tengah: Dua tab fungsional terdistribusi rata: **`Task`** (dengan badge counter real-time `Task 2`) dan **`Calender`**, dengan garis indikator bawah yang rapi.
  - Kanan: Tombol aksi **`+`** (tambah tugas cepat) di pojok kanan. Tombol `✕` telah dihapus total untuk menjaga kemurnian estetika minimalis.
- **Interaksi Expandable Input (Tombol `+`) & Penjadwalan Waktu:**
  - Input field tersembunyi secara default untuk menjaga tampilan tetap lega.
  - Saat tombol `+` di header diklik, area input meluncur terbuka halus (*smooth slide-down transition*) dengan autofocus kursor langsung aktif.
  - Terdapat input tanggal kalender akurat (`<input type="date">`) dengan visual minimalis dan default tanggal hari ini, serta shortcut cepat (*Hari ini*, *Besok*).
  - Pengguna mengetik tugas lalu menekan `Enter` untuk menyimpan, atau `Esc` / klik tombol `+` lagi untuk menutup form.
- **Komponen Tab `Task`:**
  - **Filter Chip:** `Semua`, `Aktif`, `Selesai` untuk organisasi cepat.
  - **Task List Rows:** Checkbox lingkaran (*circular check*), teks tugas dengan animasi coret (*strikethrough*), dan **Badge Hari Relatif Dinamis** di samping kanan (`Hari ini`, `Besok`, `-9 hr`, `+3 hr`) yang otomatis dihitung berdasarkan selisih tanggal.
  - **Footer:** Tombol *Bersihkan Selesai* dan pintasan shortcut `Esc`.
- **Komponen Tab `Calender`:**
  - Mini kalender grid interaktif mingguan dan timeline agenda tugas.

### 1.4. Pola UX 4: Compact Focus Capsule (Gaya Raycast)
- **Karakter Alur Kerja:** Hemat ruang maksimal untuk browsing santai.
- **Komponen:** Kartu ultra-ringkas dengan tombol quick-action popdown, fokus pada 3-5 tugas teratas.

---

## 2. Struktur Komponen (Shadow Root DOM Hierarchy)

```html
<div class="todo-widget-card" role="dialog" aria-labelledby="widget-tab-task">
  <!-- Header Bar -->
  <header class="widget-header">
    <div class="brand-logo" title="App Logo">
      <svg class="logo-icon" viewBox="0 0 24 24"><!-- Stylized Brand Icon --></svg>
    </div>
    <nav class="widget-tabs" role="tablist">
      <button class="tab-item active" data-tab="task" role="tab">Task</button>
      <button class="tab-item" data-tab="calender" role="tab">Calender</button>
      <button class="tab-item" data-tab="new-task" role="tab">New Task</button>
      <div class="tab-indicator"></div>
    </nav>
    <button class="btn-close-widget" title="Tutup">✕</button>
  </header>

  <!-- Tab Panel 1: Task List -->
  <section class="tab-panel active" id="panel-task">
    <ul class="task-items-list">
      <li class="task-item-row">
        <label class="checkbox-container">
          <input type="checkbox" class="circular-checkbox" />
          <span class="custom-circle"></span>
        </label>
        <span class="task-title">read the md</span>
        <button class="btn-row-action btn-delete" title="Hapus">✕</button>
      </li>
    </ul>
    <div class="widget-footer-meta">
      <span class="meta-counter">2 tugas aktif</span>
    </div>
  </section>

  <!-- Tab Panel 2: Calender -->
  <section class="tab-panel" id="panel-calender">
    <!-- Mini Agenda Calendar Grid -->
  </section>

  <!-- Tab Panel 3: New Task -->
  <section class="tab-panel" id="panel-new-task">
    <form class="quick-add-form">
      <input type="text" class="quick-input" placeholder="Tulis tugas baru..." autofocus />
      <button type="submit" class="btn-submit-task">Tambah</button>
    </form>
  </section>
</div>
```

---

## 3. Katalog 30 Desain Minimalis Terang (30 Curated Light Designs)

Sistem menyediakan 30 preset tema terang yang dapat dipilih pengguna:

| No | Nama Tema & Referensi | Karakter Visual Utama | Aksen & Palet Dominan |
|---|---|---|---|
| 01 | **Things 3 Clean White** (Apple Ecosystem) | Putih bersih, sudut halus 12px, soft elevation | `#ffffff`, `#007aff` (iOS Blue), `#8e8e93` |
| 02 | **Notion Workspace Light** (Notion) | Warm off-white, border tipis, sans terstruktur | `#ffffff`, border `#e9e9e7`, teks `#37352f` |
| 03 | **Linear Clean Light** (Linear.app) | Presisi engineering, hairline border, mono details | `#fcfcfc`, border `#e2e4e9`, aksen `#5e6ad2` |
| 04 | **Apple Reminders Light** (macOS Sequoia) | Checkbox lingkaran tebal berwarna, clean type | Translucent `#ffffffcc`, aksen `#007aff`, `#34c759` |
| 05 | **Craft.do Document Card** (Craft Docs) | Card elevation dalam, sudut lengkung lembut | `#fbfbfb`, card `#ffffff`, shadow lembut |
| 06 | **Bear Notes Warm Paper** (Bear App) | Kertas krem hangat, nuansa sepia, crimson aksen | Ivory `#faf8f5`, border `#ebdccb`, crimson `#d9534f` |
| 07 | **X (Twitter) Light Minimal** (X Platform) | Putih solid, garis abu tipis, kontras tinggi | `#ffffff`, border `#eff3f4`, teks `#0f1419`, `#1d9bf0` |
| 08 | **Raycast Quick Light** (Raycast) | Command bar style, keycaps hint, stroke rapi | `#f8f9fa`, border `#dce0e5`, aksen `#ff6363` |
| 09 | **Muji / Japanese Zen Paper** (Muji Aesthetic) | Ivory alami, garis charcoal lembut, hening | `#faf7f2`, border `#e6ded1`, charcoal `#2d2b28` |
| 10 | **Swiss Typography** (International Grid) | Monokrom ketat, garis 1px hitam tegas, tanpa shadow | `#ffffff`, border `#111111`, sans tebal |
| 11 | **Stripe Modern Dashboard** (Stripe) | Slate terang ultra-refined, micro-badge | `#f8fafc`, card `#ffffff`, aksen blurple `#635bff` |
| 12 | **Vercel / Geist Minimal** (Vercel) | Stark pure white, border `#eaeaea`, tipografi presisi | `#ffffff`, border `#eaeaea`, aksen `#000000` |
| 13 | **Arc Browser Light Float** (The Browser Co) | Playful rounded tab, pastel touch, modern pill | `#fdfbf7`, border `#e8e4de`, aksen coral `#ff6b6b` |
| 14 | **GitHub Modern Light** (GitHub UI) | Slate-gray border `#d0d7de`, green check | Canvas `#f6f8fa`, aksen `#1a7f37` (Git Green) |
| 15 | **Todoist Modern Light** (Todoist) | Bersih bersahabat, circular check merah khas | `#ffffff`, border `#f0f0f0`, aksen merah `#e44332` |
| 16 | **Editorial Monocle Magazine** | Tipografi serif berkelas, garis tipis buku | `#fcfbf9`, border `#e5e2dc`, serif `Georgia` |
| 17 | **Soft Neo-Brutalism Light** | Border 2px hitam, offset shadow tegas 3px, fun | Cream `#fffdf9`, border `#18181b`, shadow `#18181b` |
| 18 | **Nordic Hygge White** (Scandinavian) | Off-white sejuk, aksen glacial pine, hening | `#f5f6f8`, border `#e5e7eb`, aksen pine `#2e6f5e` |
| 19 | **Substack Clean Reader** | Gaya majalah digital, aksen oranye signature | `#ffffff`, border `#f1f1f1`, aksen oranye `#ff6719` |
| 20 | **Superhuman Minimalist** | Super ringkas, shortcut badges, aksen cyan | `#ffffff`, border `#e2e8f0`, aksen `#0284c7` |
| 21 | **macOS Frosted Glass Light** | Kaca buram translusen 24px blur, pantulan cahaya | `rgba(255,255,255,0.75)`, border `rgba(0,0,0,0.06)` |
| 22 | **Monochrome High-Contrast Ink** | Hitam & putih mutlak, underline tebal 2px | `#ffffff`, teks `#000000`, underline hitam solid |
| 23 | **Sage & Matcha Pastel** (Natural Earth) | Hijau sage pastel lembut, aksen hutan menenangkan | Soft sage `#f2f5f3`, aksen forest `#3d5a45` |
| 24 | **Warm Sand & Terracotta** (Warm Desert) | Pasir hangat, aksen terakota Mediterania | Sand `#faf6f0`, aksen terracotta `#c2593f` |
| 25 | **Lavender Focus Studio** (Modern Calm) | Putih lavender lembut, aksen ungu iris | `#fbf9ff`, border `#eee8fc`, aksen `#7c3aed` |
| 26 | **Architectural Blueprint White** | Grid halus latar belakang, garis drafting teknis | `#f9fafb`, grid dots `#e5e7eb`, aksen `#2563eb` |
| 27 | **Obsidian Minimal Light** | Knowledge management, graphite modern | `#f8f9fa`, border `#e9ecef`, aksen `#705dcf` |
| 28 | **Medium Story Minimal** | Gaya esai medium, aksen emerald green | `#ffffff`, border `#e6e6e6`, aksen hijau `#0f730c` |
| 29 | **Minimalist Wireframe Blueprint** | Garis putus-putus halus, circular hollow check | `#fdfdfd`, border dashed `#cbd5e1`, aksen `#475569` |
| 30 | **Compact Floating Island** | Floating pill widget, rounded 16px, multi-elevation | `#ffffff`, border `#edf2f7`, soft deep shadow |

---

## 3. Desain Sistem & Variabel CSS

### 3.1. Palette Warna
- **Background Utama Panel:** Slate Gelap `#0f172a`
- **Kartu Tugas (Card):** `#1e293b`
- **Border Kartu:** `#334155`
- **Aksen Primer:** `#3b82f6` (Cobalt / Vibrant Blue)
- **Teks Primer:** `#f8fafc`
- **Teks Sekunder (Muted):** `#94a3b8`
- **Status Selesai (Completed):** `#64748b`
- **Bahaya / Hapus (Danger):** `#ef4444`

---

## 4. State Management di Front-End
Front-end memelihara state lokal di dalam memory dan menyinkronkannya ke `chrome.storage.local`:
```javascript
let state = {
  tasks: [],         // Array objek: { id, title, completed, createdAt }
  currentFilter: 'all', // 'all' | 'active' | 'completed'
  isOpen: false
};
```
