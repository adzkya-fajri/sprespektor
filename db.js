/**
 * db.js - Modul Manajemen IndexedDB (TodoAppDB)
 * Berbasis Promise / async-await murni tanpa library eksternal
 */

class TodoDatabase {
  constructor() {
    this.dbName = "TodoAppDB";
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * Inisialisasi koneksi database & skema Object Store
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Buat Object Store 'todos' jika belum ada
        if (!db.objectStoreNames.contains("todos")) {
          const todoStore = db.createObjectStore("todos", { keyPath: "id" });
          todoStore.createIndex("idx_dueDate", "dueDate", { unique: false });
          todoStore.createIndex("idx_completed", "completed", { unique: false });
          todoStore.createIndex("idx_createdAt", "createdAt", { unique: false });
        }

        // 2. Buat Object Store 'settings' jika belum ada
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("Gagal membuka IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Mengambil semua tugas dari database
   */
  async getAllTodos() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("todos", "readonly");
      const store = tx.objectStore("todos");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Menambahkan tugas baru
   */
  async addTodo(todoItem) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("todos", "readwrite");
      const store = tx.objectStore("todos");
      const request = store.add(todoItem);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Memperbarui tugas yang sudah ada (status completed, edit teks, atau tanggal)
   */
  async updateTodo(todoItem) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("todos", "readwrite");
      const store = tx.objectStore("todos");
      const request = store.put(todoItem);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Menghapus tugas berdasarkan ID
   */
  async deleteTodo(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("todos", "readwrite");
      const store = tx.objectStore("todos");
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Menghapus semua tugas yang berstatus selesai
   */
  async deleteCompletedTodos() {
    await this.init();
    const all = await this.getAllTodos();
    const completedIds = all.filter(t => t.completed).map(t => t.id);

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("todos", "readwrite");
      const store = tx.objectStore("todos");

      completedIds.forEach(id => store.delete(id));

      tx.oncomplete = () => resolve(completedIds.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Mengambil setting konfigurasi
   */
  async getSetting(key, defaultValue = null) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("settings", "readonly");
      const store = tx.objectStore("settings");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Menyimpan setting konfigurasi
   */
  async setSetting(key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      const request = store.put({ key, value });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

// Inisialisasi instance global singleton
const todoDB = new TodoDatabase();
