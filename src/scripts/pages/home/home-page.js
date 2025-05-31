// src/scripts/pages/home-page.js
import HomePresenter from "../../presenters/home-presenter";
import StoryModel from "../../data/story-model";
import NotificationPresenter from "../../presenters/notification-presenter";

export default class HomePage {
  constructor() {
    this.homePresenter = null;
    this.notificationPresenter = null;
    this.map = null;
    this.storyModel = new StoryModel();
  }

  async render() {
    return `
      <section class="home-main" id="main-section" tabindex="-1">
        <section class="hero">
          <h1>Story Explorer</h1>
          <p>Discover amazing stories from around the world</p>
        </section>

        <section class="notification-section">
          <h2>Push Notifications</h2>
          <p id="notification-status">Memuat status notifikasi...</p>
          <button id="subscribe-button" class="action-button hidden">Berlangganan Notifikasi</button>
          <button id="unsubscribe-button" class="action-button hidden">Berhenti Berlangganan Notifikasi</button>
          <div id="notification-message" class="info-message hidden" role="alert" aria-live="assertive"></div>
        </section>

        <section class="stories-section">
          <h2>Latest Stories</h2>
          <div class="story-controls" style="margin-bottom: 20px;">
            <button id="show-all-stories-button" class="action-button primary">Tampilkan Semua Cerita</button>
            <button id="show-favorite-stories-button" class="action-button secondary">Tampilkan Favorit</button>
          </div>

          <div id="loading" class="loading hidden" aria-live="polite">
            <div class="spinner"></div>
            <p>Memuat cerita...</p>
          </div>

          <div id="error-message" class="error-message hidden" role="alert" aria-live="assertive"></div>

          <div id="stories-container" class="stories-grid"></div>

          <div id="favorite-controls-container" class="offline-control-section hidden" style="margin-top: 30px; text-align: center;">
            <h3>Kontrol Cerita Favorit</h3>
            <button id="clearAllFavoriteStoriesButton" class="action-button red">Hapus Semua Favorit</button>
            <p class="info-message" id="clearMessage" style="display: none; margin-top: 10px;"></p>
          </div>
        </section>

        <section class="map-section">
          <h2>Story Locations</h2>
          <div id="map" class="map-container" role="img" aria-label="Interactive map showing story locations"></div>
        </section>
      </section>
    `;
  }

  async afterRender() {
    this.homePresenter = new HomePresenter(this, this.storyModel);
    await this.homePresenter.init();

    this.notificationPresenter = new NotificationPresenter(this);
    await this.notificationPresenter.init();

    const subscribeButton = document.getElementById("subscribe-button");
    const unsubscribeButton = document.getElementById("unsubscribe-button");

    if (subscribeButton) {
      subscribeButton.addEventListener("click", async () => {
        await this.notificationPresenter.handleSubscribe();
      });
    }

    if (unsubscribeButton) {
      unsubscribeButton.addEventListener("click", async () => {
        await this.notificationPresenter.handleUnsubscribe();
      });
    }

    // --- Logika untuk tombol Hapus Semua Cerita Favorit ---
    const clearAllButton = document.getElementById(
      "clearAllFavoriteStoriesButton"
    );
    if (clearAllButton) {
      clearAllButton.addEventListener("click", async () => {
        if (
          confirm(
            "Apakah Anda yakin ingin menghapus SEMUA cerita favorit yang tersimpan secara offline?"
          )
        ) {
          await this.homePresenter.handleClearAllFavoriteStories();
        }
      });
    }

    // --- Logika untuk Tombol Tampilkan Semua Cerita / Favorit ---
    document
      .getElementById("show-all-stories-button")
      .addEventListener("click", () => {
        this.homePresenter.init(); // Memuat ulang semua cerita (dari API)
      });
    document
      .getElementById("show-favorite-stories-button")
      .addEventListener("click", () => {
        this.homePresenter.loadFavoriteStories(); // Memuat cerita favorit
      });
  }

  showLoading() {
    document.getElementById("loading")?.classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loading")?.classList.add("hidden");
  }

  showError(message) {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove("hidden");
    }
  }

  hideError() {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.classList.add("hidden");
      errorElement.textContent = "";
    }
  }

  showClearMessage(message, isSuccess) {
    const clearMessage = document.getElementById("clearMessage");
    if (clearMessage) {
      clearMessage.textContent = message;
      clearMessage.style.display = "block";
      clearMessage.classList.remove("error-message", "success-message");
      clearMessage.classList.add(
        isSuccess ? "success-message" : "error-message"
      );
      setTimeout(() => {
        clearMessage.style.display = "none";
      }, 5000); // Sembunyikan setelah 5 detik
    }
  }

  displayStories(data) {
    const container = document.getElementById("stories-container");
    if (!container) return;

    if (data.error) {
      this.showError(data.message);
      container.innerHTML = "";
      this.initializeMap([]);
      return;
    }

    const stories = data.listStory || [];
    if (stories.length === 0) {
      container.innerHTML =
        '<p class="info-message">Tidak ada cerita untuk ditampilkan. Favoritkan beberapa cerita atau periksa koneksi Anda jika sedang offline untuk melihat cerita terbaru.</p>';
      this.initializeMap([]);
      return;
    }

    container.innerHTML = this.generateStoriesHTML(stories);
    this.attachStoryCardEvents(container);
    this.initializeMap(stories);
  }

  appendStories(newStories) {
    const container = document.getElementById("stories-container");
    if (!container) return;

    const storiesToAppend = newStories.listStory || newStories;

    if (storiesToAppend && storiesToAppend.length > 0) {
      const newHTML = this.generateStoriesHTML(storiesToAppend);
      container.insertAdjacentHTML("beforeend", newHTML);

      const newCards = container.querySelectorAll(
        ".story-card:not([data-events-attached])"
      );
      this.attachStoryCardEvents(container, newCards);
    }
  }

  generateStoriesHTML(stories) {
    return stories
      .map(
        (story) => `
        <article class="story-card" data-story-id="${story.id}">
          <img src="${story.photoUrl}" alt="Story photo: ${
          story.description
        }" class="story-image" loading="lazy">
          <div class="story-content">
            <h3 class="story-title">${story.name}</h3>
            <p class="story-description">${story.description}</p>
            <time class="story-date" datetime="${story.createdAt}">
              ${new Date(story.createdAt).toLocaleDateString()}
            </time>
            ${
              story.lat && story.lon
                ? `<p class="story-location">📍 <br>Lat: ${story.lat}<br>Lon: ${story.lon}</p>`
                : ""
            }
            <div class="story-actions">
              <button class="detail-button" data-story-id="${
                story.id
              }" aria-label="View details for story by ${
          story.name
        }">🔎 Detail</button>
              <button class="favorite-button ${
                story.isFavorite ? "favorited" : ""
              }" data-story-id="${story.id}" data-story='${JSON.stringify(
          story
        )}' aria-label="${
          story.isFavorite ? "Remove from favorites" : "Add to favorites"
        }">
                ${story.isFavorite ? "❤️ Favorited" : "🤍 Favorite"}
              </button>
            </div>
          </div>
        </article>
      `
      )
      .join("");
  }

  attachStoryCardEvents(container, cards = null) {
    const storyCards = cards || container.querySelectorAll(".story-card");

    storyCards.forEach((card) => {
      if (card.dataset.eventsAttached) return;

      const storyId = card.dataset.storyId;

      const cardHandler = () => {
        this.homePresenter.onStoryClick(storyId);
      };

      card.addEventListener("click", cardHandler);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cardHandler();
        }
      });

      const detailButton = card.querySelector(".detail-button");
      if (detailButton) {
        detailButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.homePresenter.onStoryClick(storyId);
        });
      }

      // --- Event untuk tombol Favorit ---
      const favoriteButton = card.querySelector(".favorite-button");
      if (favoriteButton) {
        favoriteButton.addEventListener("click", async (e) => {
          e.stopPropagation();
          const storyData = JSON.parse(e.target.dataset.story);
          await this.homePresenter.toggleFavorite(storyData);
        });
      }

      card.dataset.eventsAttached = "true";
    });
  }

  // --- Metode Baru: Memperbarui status favorit pada kartu cerita spesifik ---
  updateStoryCardFavoriteStatus(storyId, isFavorite) {
    const favoriteButton = document.querySelector(
      `.story-card[data-story-id="${storyId}"] .favorite-button`
    );
    if (favoriteButton) {
      if (isFavorite) {
        favoriteButton.classList.add("favorited");
        favoriteButton.textContent = "❤️ Favorited";
        favoriteButton.setAttribute("aria-label", "Remove from favorites");
      } else {
        favoriteButton.classList.remove("favorited");
        favoriteButton.textContent = "🤍 Favorite";
        favoriteButton.setAttribute("aria-label", "Add to favorites");
      }
      // Perbarui juga data-story atribut jika perlu, meskipun untuk toggle status biasanya tidak
      // Perbarui data-story untuk mencerminkan status favorit terbaru (penting untuk JSON.parse di kemudian hari)
      const currentStoryData = JSON.parse(favoriteButton.dataset.story);
      currentStoryData.isFavorite = isFavorite;
      favoriteButton.dataset.story = JSON.stringify(currentStoryData);
    }
  }

  navigateToStory(storyId) {
    window.location.hash = `/detail/${storyId}`;
  }

  initializeMap(stories) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.warn("Map element not found. Skipping map initialization.");
      return;
    }

    this.map = L.map("map").setView([-6.2088, 106.8456], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.map);

    let bounds = [];
    let hasMarkers = false;

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        hasMarkers = true;
        const marker = L.marker([story.lat, story.lon]).addTo(this.map);
        marker.bindPopup(`
          <div class="map-popup">
            <h4>${story.name}</h4>
            <p>${story.description}</p>
            <img src="${story.photoUrl}" alt="Story photo" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px;">
          </div>
        `);
        bounds.push([story.lat, story.lon]);
      }
    });

    if (hasMarkers && bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // --- View methods for NotificationPresenter (tetap sama) ---
  showNotificationUnsupported() {
    const statusElement = document.getElementById("notification-status");
    if (statusElement) {
      statusElement.textContent =
        "Notifikasi push tidak didukung oleh browser Anda.";
    }
    document.getElementById("subscribe-button")?.classList.add("hidden");
    document.getElementById("unsubscribe-button")?.classList.add("hidden");
  }

  showNotificationPermissionDenied() {
    this.showNotificationError("Izin untuk notifikasi ditolak.");
    document.getElementById("subscribe-button")?.classList.add("hidden");
    document.getElementById("unsubscribe-button")?.classList.add("hidden");
  }

  showNotificationSuccess(message) {
    const messageBox = document.getElementById("notification-message");
    if (messageBox) {
      messageBox.textContent = message;
      messageBox.classList.remove("hidden");
      messageBox.classList.remove("error-message");
      messageBox.classList.add("success-message");
      // Sembunyikan setelah beberapa detik
      setTimeout(() => {
        messageBox.classList.add("hidden");
      }, 5000);
    }
  }

  showNotificationError(message) {
    const messageBox = document.getElementById("notification-message");
    if (messageBox) {
      messageBox.textContent = message;
      messageBox.classList.remove("hidden");
      messageBox.classList.remove("success-message");
      messageBox.classList.add("error-message");
      // Sembunyikan setelah beberapa detik
      setTimeout(() => {
        messageBox.classList.add("hidden");
      }, 5000);
    }
  }

  showSubscribeButton() {
    document.getElementById("subscribe-button")?.classList.remove("hidden");
    document.getElementById("unsubscribe-button")?.classList.add("hidden");
    document.getElementById("notification-message")?.classList.add("hidden");
    document.getElementById("notification-status").textContent =
      "Anda belum berlangganan notifikasi.";
  }

  showUnsubscribeButton() {
    document.getElementById("subscribe-button")?.classList.add("hidden");
    document.getElementById("unsubscribe-button")?.classList.remove("hidden");
    document.getElementById("notification-message")?.classList.add("hidden");
    document.getElementById("notification-status").textContent =
      "Anda berlangganan notifikasi.";
  }

  showFavoriteControls() {
    const container = document.getElementById('favorite-controls-container');
    if (container) {
      container.classList.remove('hidden');
    }
  }

  hideFavoriteControls() {
    const container = document.getElementById('favorite-controls-container');
    if (container) {
      container.classList.add('hidden');
    }
    // Sembunyikan juga pesan "clear" jika sedang ditampilkan
    const clearMessage = document.getElementById('clearMessage');
    if (clearMessage) {
        clearMessage.style.display = 'none';
    }
  }
}
