# Changelog: Overlay Drawer To-Do List Extension

Seluruh histori perubahan, keputusan arsitektur, dan penambahan fitur dicatat secara kronologis dalam dokumen ini sesuai standar rekayasa.

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
