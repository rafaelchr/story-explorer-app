// src/scripts/presenters/home-presenter.js
class HomePresenter {
  constructor(view, storyModel) {
    this.view = view;
    this.storyModel = storyModel;
    this.stories = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.location = 0;
    this.isShowingFavorites = false; // State untuk melacak mode tampilan
  }

  async init() {
    this.view.showLoading();
    this.view.hideError();
    this.isShowingFavorites = false; // Pastikan kembali ke mode "Semua Cerita"
    this.view.hideFavoriteControls();

    try {
      this.currentPage = 1;
      const storiesResult = await this.storyModel.getAllStories(this.currentPage, this.pageSize, this.location);

      if (storiesResult.error) {
        this.view.showError(storiesResult.message);
        this.stories = [];
        this.view.displayStories({ listStory: [] });
      } else {
        this.stories = storiesResult.listStory || [];
        // Untuk setiap cerita, cek apakah itu favorit dan kirimkan statusnya ke view
        const storiesWithFavoriteStatus = await Promise.all(
          this.stories.map(async (story) => ({
            ...story,
            isFavorite: await this.storyModel.isStoryFavorite(story.id),
          }))
        );
        this.view.displayStories({ listStory: storiesWithFavoriteStatus });
      }

    } catch (error) {
      console.error("Error in HomePresenter init:", error);
      this.view.showError('Gagal memuat cerita. Silakan coba lagi atau periksa koneksi Anda.');
      this.stories = [];
      this.view.displayStories({ listStory: [] });
    } finally {
      this.view.hideLoading();
    }
  }

  async refreshStories() {
    // Memuat ulang cerita dari awal (page 1), tergantung mode (online/offline/favorit)
    if (this.isShowingFavorites) {
      await this.loadFavoriteStories();
    } else {
      await this.init(); // Memuat dari API
    }
  }

  onStoryClick(storyId) {
    this.view.navigateToStory(storyId);
  }

  // --- Metode Baru untuk Favorit ---

  async toggleFavorite(story) {
    this.view.showLoading();
    try {
      const isCurrentlyFavorite = await this.storyModel.isStoryFavorite(story.id);

      let result;
      if (isCurrentlyFavorite) {
        result = await this.storyModel.removeStoryFromFavorites(story.id);
        if (result.success) {
          this.view.showNotificationSuccess(result.message);
        } else {
          this.view.showNotificationError(result.message);
        }
      } else {
        result = await this.storyModel.addStoryToFavorites(story);
        if (result.success) {
          this.view.showNotificationSuccess(result.message);
        } else {
          this.view.showNotificationError(result.message);
        }
      }

      // Perbarui tampilan kartu cerita spesifik
      this.view.updateStoryCardFavoriteStatus(story.id, !isCurrentlyFavorite);

      // Jika sedang dalam mode favorit, muat ulang daftar favorit agar yang dihapus/ditambah terlihat
      if (this.isShowingFavorites) {
        await this.loadFavoriteStories();
      }

    } catch (error) {
      console.error("Error toggling favorite:", error);
      this.view.showNotificationError('Gagal mengubah status favorit.');
    } finally {
      this.view.hideLoading();
    }
  }

  async loadFavoriteStories() {
    this.view.showLoading();
    this.view.hideError();
    this.isShowingFavorites = true; // Set mode ke favorit
    this.view.showFavoriteControls();

    try {
      const result = await this.storyModel.getAllFavoriteStories();
      if (result.error) {
        this.view.showError(result.message);
        this.stories = [];
        this.view.displayStories({ listStory: [] });
      } else {
        this.stories = result.listStory || [];
        // Semua cerita di sini sudah favorit, set isFavorite ke true
        const storiesWithFavoriteStatus = this.stories.map((story) => ({
          ...story,
          isFavorite: true,
        }));
        this.view.displayStories({ listStory: storiesWithFavoriteStatus });
      }
    } catch (error) {
      console.error("Error loading favorite stories:", error);
      this.view.showError('Gagal memuat cerita favorit.');
      this.stories = [];
      this.view.displayStories({ listStory: [] });
    } finally {
      this.view.hideLoading();
    }
  }

  async handleClearAllFavoriteStories() {
    this.view.showLoading();
    const success = await this.storyModel.clearAllFavoriteStories();
    this.view.hideLoading();

    if (success) {
      this.view.showClearMessage('Semua cerita favorit berhasil dihapus dari penyimpanan offline.', true);
      this.stories = [];
      this.view.displayStories({ listStory: [] }); // Kosongkan tampilan
      this.view.initializeMap([]); // Kosongkan peta juga
      this.view.hideFavoriteControls();
    } else {
      this.view.showClearMessage('Gagal menghapus cerita favorit.', false);
    }
    // Jika sedang dalam mode favorit, muat ulang tampilan
    if (this.isShowingFavorites) {
      await this.loadFavoriteStories();
    }
  }

  async loadMoreStories() {
    // Metode ini hanya relevan jika memuat dari API.
    // Jika sedang menampilkan favorit, tidak ada "load more".
    if (this.isShowingFavorites) {
      console.log("Cannot load more stories when showing favorites.");
      return false;
    }

    this.view.showLoading();
    try {
      this.currentPage += 1;
      const storiesResult = await this.storyModel.getAllStories(this.currentPage, this.pageSize, this.location);

      if (!storiesResult.error && storiesResult.listStory && storiesResult.listStory.length > 0) {
        // Untuk setiap cerita baru, cek status favoritnya
        const newStoriesWithFavoriteStatus = await Promise.all(
          storiesResult.listStory.map(async (story) => ({
            ...story,
            isFavorite: await this.storyModel.isStoryFavorite(story.id),
          }))
        );
        this.stories = [...this.stories, ...newStoriesWithFavoriteStatus];
        this.view.appendStories({ listStory: newStoriesWithFavoriteStatus });
        return true;
      } else {
        this.currentPage -= 1;
        return false;
      }
    } catch (error) {
      console.error("Error in HomePresenter loadMoreStories:", error);
      this.view.showError('Gagal memuat cerita lebih lanjut.');
      return false;
    } finally {
      this.view.hideLoading();
    }
  }

  hideError() {
    this.view.hideError();
  }
}

export default HomePresenter;