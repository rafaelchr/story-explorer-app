import DetailStoryPresenter from "../../presenters/detail-story-presenter";
import StoryModel from "../../data/story-model";

export default class DetailStoryPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    return `
    <section id="main-section" class="detail-main" tabindex="-1" role="main">
      <h2>Story Detail</h2>
      <section id="storyDetail" aria-live="polite">Loading...</section>
      <button id="backBtn" class="btn-back">Back to Home</button>
    </section>
  `;
  }

  async afterRender() {
    const model = new StoryModel();
    this.presenter = new DetailStoryPresenter(this, model);

    const urlParts = window.location.hash.split("/");
    const storyId = urlParts[urlParts.length - 1];

    this.presenter.loadStory(storyId);

    const backBtn = document.getElementById("backBtn");
    backBtn.addEventListener("click", () => {
      window.location.hash = "/";
    });
  }

  showStory(data) {
    const container = document.getElementById("storyDetail");
    container.innerHTML = `
      <section role="region" aria-labelledby="story-title">
        <img src="${data.photoUrl}" alt="Story photo by ${
          data.name
        }" class="story-image" />
        <p><strong id="story-title">Name</strong> ${data.name}</p>
        <p><strong>Description</strong> ${data.description}</p>
        <p><strong>Created At</strong> ${new Date(
          data.createdAt
        ).toLocaleString()}</p>
        ${
          data.lat && data.lon
            ? `
              <p><strong>Location</strong> ${data.lat}, ${data.lon}</p>
              <div id="map" style="height: 300px; margin-top: 15px;" aria-label="Story location map"></div>
            `
            : ""
        }
      </section>
    `;

    // Inisialisasi peta jika ada koordinat lat dan lon
    if (data.lat && data.lon) {
      setTimeout(() => {
        // Pastikan Leaflet sudah di-load (CSS & JS di index.html)
        const map = L.map("map").setView([data.lat, data.lon], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.marker([data.lat, data.lon])
          .addTo(map)
          .bindPopup(`<b>${data.name}</b><br>${data.description}`)
          .openPopup();
      }, 100);
    }
  }

  showError(message) {
    const container = document.getElementById("storyDetail");
    container.innerHTML = `<p style="color:red;">${message}</p>`;
  }
}
