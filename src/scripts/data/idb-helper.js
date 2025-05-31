// src/scripts/data/idb-helper.js
import { openDB } from 'idb'; // Pastikan Anda memiliki library idb terinstall (npm install idb)

const DATABASE_NAME = 'StoryAppDatabase';
const DATABASE_VERSION = 1;
const STORIES_OBJECT_STORE_NAME = 'stories'; // Untuk cache story dari API
const FAVORITE_STORIES_OBJECT_STORE_NAME = 'favorite-stories'; // Untuk story favorit

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    // Buat object store untuk cerita utama (cache)
    if (!database.objectStoreNames.contains(STORIES_OBJECT_STORE_NAME)) {
      database.createObjectStore(STORIES_OBJECT_STORE_NAME, { keyPath: 'id' });
    }
    // Buat object store TERPISAH untuk cerita favorit
    if (!database.objectStoreNames.contains(FAVORITE_STORIES_OBJECT_STORE_NAME)) {
      database.createObjectStore(FAVORITE_STORIES_OBJECT_STORE_NAME, { keyPath: 'id' });
    }
  },
});

class IdbHelper {
  async initDb() {
    return dbPromise;
  }

  // --- Metode untuk Cache Story Utama (dari API) ---

  async putAllStories(stories) {
    const db = await this.initDb();
    const tx = db.transaction(STORIES_OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_OBJECT_STORE_NAME);
    for (const story of stories) {
      if (story && story.id) {
        store.put(story);
      } else {
        console.warn('Skipping story without ID during putAllStories (cache):', story);
      }
    }
    return tx.done;
  }

  async getAllStories() {
    const db = await this.initDb();
    return db.getAll(STORIES_OBJECT_STORE_NAME);
  }

  async getStoryById(id) {
    const db = await this.initDb();
    return db.get(STORIES_OBJECT_STORE_NAME, id);
  }

  async deleteStory(id) {
    const db = await this.initDb();
    await db.delete(STORIES_OBJECT_STORE_NAME, id);
  }

  async clearAllStories() {
    const db = await this.initDb();
    await db.clear(STORIES_OBJECT_STORE_NAME);
  }

  // --- Metode Baru untuk Cerita Favorit ---

  async putFavoriteStory(story) {
    const db = await this.initDb();
    const tx = db.transaction(FAVORITE_STORIES_OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(FAVORITE_STORIES_OBJECT_STORE_NAME);
    // Pastikan story memiliki properti isFavorite saat disimpan sebagai favorit
    // Anda bisa menambahkan ini secara eksplisit di sini jika story dari API tidak memiliki isFavorite
    const favoriteStory = { ...story, isFavorite: true };
    await store.put(favoriteStory);
    return tx.done;
  }

  async deleteFavoriteStory(id) {
    const db = await this.initDb();
    await db.delete(FAVORITE_STORIES_OBJECT_STORE_NAME, id);
  }

  async getFavoriteStoryById(id) {
    const db = await this.initDb();
    return db.get(FAVORITE_STORIES_OBJECT_STORE_NAME, id);
  }

  async getAllFavoriteStories() {
    const db = await this.initDb();
    return db.getAll(FAVORITE_STORIES_OBJECT_STORE_NAME);
  }

  async clearAllFavoriteStories() {
    const db = await this.initDb();
    await db.clear(FAVORITE_STORIES_OBJECT_STORE_NAME);
  }
}

export default new IdbHelper(); // Ekspor instance tunggal