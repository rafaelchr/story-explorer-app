// src/scripts/data/StoryModel.js
import IdbHelper from './idb-helper'; // Import helper IndexedDB

class StoryModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1";
  }

  // --- Metode untuk Mengambil Semua Story (dengan Offline Fallback) ---
  async getAllStories(page = 1, size = 10, location = 0) {
    const token = localStorage.getItem("authToken");

    // Jika tidak ada token, langsung coba ambil dari IndexedDB (cache utama)
    if (!token) {
      console.log('No auth token found. Attempting to get stories from IndexedDB (cache)...');
      const offlineStories = await IdbHelper.getAllStories();
      if (offlineStories && offlineStories.length > 0) {
        console.log('Displaying stories from IndexedDB (offline, no token).');
        // Saat menampilkan dari cache, kita juga perlu memeriksa status favoritnya
        const storiesWithFavoriteStatus = await Promise.all(
          offlineStories.map(async (story) => ({
            ...story,
            isFavorite: await this.isStoryFavorite(story.id),
          }))
        );
        return { error: false, message: "Stories loaded from offline cache.", listStory: storiesWithFavoriteStatus };
      } else {
        console.log('No offline stories available and no token.');
        return { error: true, message: "Please login to fetch stories or no offline data available.", listStory: [] };
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/stories?page=${page}&size=${size}&location=${location}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
            console.warn("Authentication token expired or invalid. Clearing token...");
            localStorage.removeItem("authToken");
            return { error: true, message: "Session expired. Please re-login to fetch new stories.", listStory: [] };
        }

        console.error(`HTTP error! status: ${response.status}. Attempting to get stories from IndexedDB (cache)...`);
        const offlineStories = await IdbHelper.getAllStories();
        if (offlineStories && offlineStories.length > 0) {
          console.log('Displaying stories from IndexedDB (offline fallback).');
          const storiesWithFavoriteStatus = await Promise.all(
            offlineStories.map(async (story) => ({
              ...story,
              isFavorite: await this.isStoryFavorite(story.id),
            }))
          );
          return { error: false, message: "Stories loaded from offline cache.", listStory: storiesWithFavoriteStatus };
        } else {
          console.log('No offline stories available.');
          return { error: true, message: `Failed to fetch stories: ${response.statusText || 'Network error'}. No offline data available.`, listStory: [] };
        }
      }

      const data = await response.json();

      if (data.listStory) {
        // Simpan ke cache utama
        await IdbHelper.putAllStories(data.listStory);
        // console.log('Stories successfully fetched from API and saved to IndexedDB (cache).');

        // Tambahkan status favorit ke setiap story sebelum dikembalikan
        const storiesWithFavoriteStatus = await Promise.all(
          data.listStory.map(async (story) => ({
            ...story,
            isFavorite: await this.isStoryFavorite(story.id),
          }))
        );
        return { ...data, listStory: storiesWithFavoriteStatus };
      }
      return data;
    } catch (error) {
      console.error("Error fetching stories from API:", error);
      console.log('Attempting to get stories from IndexedDB (cache) due to network error...');
      const offlineStories = await IdbHelper.getAllStories();
      if (offlineStories && offlineStories.length > 0) {
        console.log('Displaying stories from IndexedDB (offline).');
        const storiesWithFavoriteStatus = await Promise.all(
          offlineStories.map(async (story) => ({
            ...story,
            isFavorite: await this.isStoryFavorite(story.id),
          }))
        );
        return { error: false, message: "Stories loaded from offline cache.", listStory: storiesWithFavoriteStatus };
      } else {
        console.log('No offline stories available and network error persists.');
        return { error: true, message: "Failed to fetch stories and no offline data available.", listStory: [] };
      }
    }
  }

  // --- Metode untuk Menambah Story (API) ---
  async addStory({ description, photo, lat, lon }) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return { error: true, message: "Authentication token is missing. Please log in." };
    }

    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);
    if (lat !== undefined && lat !== null) formData.append("lat", lat);
    if (lon !== undefined && lon !== null) formData.append("lon", lon);

    try {
      const response = await fetch(`${this.baseUrl}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        console.log('Story added successfully to API.');
      } else {
        throw new Error(result.message || `Failed to add story with status: ${response.status}`);
      }
      return result;
    } catch (error) {
      console.error("Error adding story:", error);
      return { error: true, message: error.message || "Failed to add story." };
    }
  }

  // --- Metode untuk Mengambil Story Berdasarkan ID (dengan Offline Fallback) ---
  async getStoryById(id) {
    const token = localStorage.getItem("authToken");

    // Jika tidak ada token, coba ambil dari IndexedDB (cache utama atau favorit)
    if (!token) {
      console.log(`No auth token found. Attempting to get story ${id} from IndexedDB (cache or favorites)...`);
      let offlineStory = await IdbHelper.getStoryById(id); // Coba dari cache utama
      if (!offlineStory) {
        offlineStory = await IdbHelper.getFavoriteStoryById(id); // Coba dari favorit
      }

      if (offlineStory) {
        console.log('Displaying story from IndexedDB (offline, no token).');
        return { error: false, message: "Story loaded from offline cache.", story: offlineStory };
      } else {
        console.log('No offline story available and no token.');
        return { error: true, message: "Please login to fetch story or no offline data available.", story: null };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/stories/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
         if (response.status === 401) {
            console.warn("Authentication token expired or invalid. Clearing token...");
            localStorage.removeItem("authToken");
            return { error: true, message: "Session expired. Please re-login.", story: null };
        }

        console.error(`HTTP error! status: ${response.status}. Attempting to get story ${id} from IndexedDB (cache or favorites)...`);
        let offlineStory = await IdbHelper.getStoryById(id); // Coba dari cache utama
        if (!offlineStory) {
          offlineStory = await IdbHelper.getFavoriteStoryById(id); // Coba dari favorit
        }

        if (offlineStory) {
          console.log('Displaying story from IndexedDB (offline fallback).');
          return { error: false, message: "Story loaded from offline cache.", story: offlineStory };
        } else {
          console.log('No offline story available.');
          throw new Error(result.message || `Failed to fetch story ${id}: ${response.statusText || 'Network error'}. No offline data available.`);
        }
      }

      // Simpan detail story ke cache utama (jika belum ada/perlu update)
      if (result.story) {
        await IdbHelper.putStory(result.story); // Menyimpan satu story detail ke cache utama
        console.log(`Story ${id} successfully fetched from API and saved to IndexedDB (cache).`);

        // Tambahkan status favorit ke story detail sebelum dikembalikan
        const storyWithFavoriteStatus = {
          ...result.story,
          isFavorite: await this.isStoryFavorite(result.story.id),
        };
        return { ...result, story: storyWithFavoriteStatus };
      }
      return result; // Jika tidak ada result.story, kembalikan saja result asli
    } catch (error) {
      console.error(`Error fetching story ${id} from API:`, error);
      console.log(`Attempting to get story ${id} from IndexedDB (cache or favorites) due to network error...`);
      let offlineStory = await IdbHelper.getStoryById(id); // Coba dari cache utama
      if (!offlineStory) {
        offlineStory = await IdbHelper.getFavoriteStoryById(id); // Coba dari favorit
      }

      if (offlineStory) {
        console.log('Displaying story from IndexedDB (offline).');
        return { error: false, message: "Story loaded from offline cache.", story: offlineStory };
      } else {
        console.log('No offline story available and network error persists.');
        return { error: true, message: error.message || `Failed to fetch story ${id} and no offline data available.`, story: null };
      }
    }
  }

  // --- Metode untuk Mengelola Story di Cache IndexedDB (utama) ---
  // Ini tetap dipertahankan karena digunakan untuk mengelola cache offline umum.
  async deleteStoryFromLocal(id) {
    try {
      await IdbHelper.deleteStory(id);
      console.log(`Story ${id} deleted from IndexedDB cache.`);
      return true;
    } catch (error) {
      console.error(`Error deleting story ${id} from IndexedDB cache:`, error);
      return false;
    }
  }

  async clearAllStoriesFromLocal() {
    try {
      await IdbHelper.clearAllStories();
      console.log('All stories cleared from IndexedDB cache.');
      return true;
    } catch (error) {
      console.error('Error clearing all stories from IndexedDB cache:', error);
      return false;
    }
  }

  // --- METODE BARU UNTUK FITUR FAVORIT (berinteraksi dengan IdbHelper.Favorite) ---

  async addStoryToFavorites(storyData) {
    try {
      // storyData harus berisi ID dan data yang cukup untuk disimpan sebagai favorit
      await IdbHelper.putFavoriteStory(storyData);
      console.log(`Story ${storyData.id} added to favorites.`);
      return { success: true, message: 'Cerita berhasil ditambahkan ke favorit.' };
    } catch (error) {
      console.error("Error adding story to favorites:", error);
      return { success: false, message: 'Gagal menambahkan cerita ke favorit.' };
    }
  }

  async removeStoryFromFavorites(storyId) {
    try {
      await IdbHelper.deleteFavoriteStory(storyId);
      console.log(`Story ${storyId} removed from favorites.`);
      return { success: true, message: 'Cerita berhasil dihapus dari favorit.' };
    } catch (error) {
      console.error("Error removing story from favorites:", error);
      return { success: false, message: 'Gagal menghapus cerita dari favorit.' };
    }
  }

  async isStoryFavorite(storyId) {
    const favoriteStory = await IdbHelper.getFavoriteStoryById(storyId);
    return !!favoriteStory; // Mengembalikan true jika ditemukan, false jika tidak
  }

  async getAllFavoriteStories() {
    try {
      const favoriteStories = await IdbHelper.getAllFavoriteStories();
      console.log('Fetched all favorite stories from IndexedDB.');
      return { error: false, message: "Favorite stories loaded from offline storage.", listStory: favoriteStories };
    } catch (error) {
      console.error("Error getting all favorite stories:", error);
      return { error: true, message: "Gagal memuat cerita favorit dari penyimpanan offline.", listStory: [] };
    }
  }

  async clearAllFavoriteStories() {
    try {
      await IdbHelper.clearAllFavoriteStories();
      console.log('All favorite stories cleared from IndexedDB.');
      return true; // Mengembalikan true untuk indikasi sukses
    } catch (error) {
      console.error('Error clearing all favorite stories from IndexedDB:', error);
      return false; // Mengembalikan false untuk indikasi gagal
    }
  }
}

export default StoryModel;