# Rancangan Front-End: Overlay Drawer To-Do List

## 1. Konsep & Prinsip UI/UX
- **In-Page Overlay (Slide-over Drawer):** Meluncur mulus dari sisi kanan layar browser menimpa konten halaman web.
- **Isolasi Penuh (Shadow DOM):** Seluruh styling menggunakan encapsulation Shadow DOM sehingga CSS dari website mana pun (misal: YouTube, GitHub, Wikipedia, web berita) tidak merusak tampilan To-Do List.
- **Interaksi Ergonomis:**
  - Tambah tugas cepat: Ketik lalu tekan `Enter`.
  - Tombol aksi hapus: Tersembunyi secara default dan muncul halus saat kursor mengarahkan ke baris tugas (*hover state*).
  - Checkbox custom: Transisi warna dan efek teks coret (*strikethrough*) yang jelas.
  - Shortcut Keyboard: Tombol `Escape` langsung menutup panel overlay.
  - Klik Luar (Backdrop): Mengklik area redup di luar drawer otomatis menutup panel.

---

## 2. Struktur Komponen (Shadow Root DOM Hierarchy)

```html
<div class="todo-overlay-backdrop">
  <aside class="todo-drawer" role="dialog" aria-labelledby="todo-title">
    <!-- Header -->
    <header class="drawer-header">
      <div class="header-brand">
        <span class="brand-icon">✓</span>
        <h2 id="todo-title">To-Do List</h2>
        <span class="active-badge" id="active-count-badge">0 aktif</span>
      </div>
      <button class="btn-close" id="btn-close-drawer" aria-label="Tutup panel">✕</button>
    </header>

    <!-- Quick Add Input -->
    <div class="input-section">
      <div class="input-wrapper">
        <span class="input-icon">+</span>
        <input 
          type="text" 
          id="task-input" 
          placeholder="Tulis tugas baru lalu tekan Enter..." 
          autocomplete="off" 
          maxlength="200"
        />
      </div>
    </div>

    <!-- Filter Tabs -->
    <nav class="filter-nav" aria-label="Filter status tugas">
      <button class="filter-btn active" data-filter="all">Semua</button>
      <button class="filter-btn" data-filter="active">Aktif</button>
      <button class="filter-btn" data-filter="completed">Selesai</button>
    </nav>

    <!-- Task List Container -->
    <main class="task-container custom-scrollbar">
      <ul class="task-list" id="task-list-ul">
        <!-- Rendered via JS -->
      </ul>

      <!-- Empty State -->
      <div class="empty-state" id="empty-state-view">
        <div class="empty-icon">📝</div>
        <p class="empty-title">Belum ada tugas</p>
        <p class="empty-desc">Tambahkan tugas baru untuk mulai mengorganisir harimu.</p>
      </div>
    </main>

    <!-- Footer Stats -->
    <footer class="drawer-footer">
      <span class="footer-hint">Tekan <code>Esc</code> untuk menutup</span>
      <button class="btn-clear-completed" id="btn-clear-completed">Hapus selesai</button>
    </footer>
  </aside>
</div>
```

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
