import AddStoryPresenter from "../../presenters/add-story-presenter";
import StoryModel from "../../data/story-model";

export default class AddStoryPage {
  constructor() {
    this.presenter = null;
    this.capturedBlob = null; // untuk simpan hasil capture sebagai Blob
  }

  async render() {
    return `
    <section id="main-section" class="add-main" tabindex="-1" role="main">
      <h2>Add New Story</h2>
      <form id="storyForm" novalidate>
          <label for="description">Description <span aria-hidden="true">*</span></label>
          <textarea id="description" name="description" required aria-required="true"></textarea>

          <label for="video">Camera Preview</label>
          <video id="video" autoplay playsinline aria-label="Live camera preview"></video>
          <button id="captureBtn" type="button">Capture Photo</button>

          <img id="preview" alt="Captured photo preview" style="display:none;" />

          <label for="lat">Latitude (click map)</label>
          <input type="number" step="any" id="lat" name="lat" readonly aria-readonly="true" />

          <label for="lon">Longitude (click map)</label>
          <input type="number" step="any" id="lon" name="lon" readonly aria-readonly="true" />

          <div id="map" role="application" aria-label="Map to select location"></div>

          <button id="submitBtn" type="button">Submit Story</button>
      </form>

      <div id="statusMessage" role="alert" aria-live="polite"></div>
    </section>
  `;
  }

  async afterRender() {
    const model = new StoryModel();
    this.presenter = new AddStoryPresenter(this, model);

    const video = document.getElementById("video");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.srcObject = this.stream;
      await video.play();
    } catch (err) {
      this.showStatus("Error accessing camera: " + err.message, true);
    }

    // Tombol capture foto
    const captureBtn = document.getElementById("captureBtn");
    const preview = document.getElementById("preview");
    captureBtn.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          this.capturedBlob = blob; // simpan hasil capture sebagai Blob
          // buat URL sementara untuk preview
          preview.src = URL.createObjectURL(blob);
          preview.style.display = "block";
        },
        "image/jpeg",
        0.95
      );
    });

    // Inisialisasi peta untuk pilih lat dan lon
    this.initMap();

    // Submit story
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.addEventListener("click", () => {
      const description = document.getElementById("description").value;
      const lat = document.getElementById("lat").value || null;
      const lon = document.getElementById("lon").value || null;
      const photo = this.capturedBlob;

      if (!description) {
        this.showStatus("Description is required", true);
        return;
      }
      if (!photo) {
        this.showStatus("Please capture a photo first", true);
        return;
      }

      this.presenter.submitStory({ description, photo, lat, lon });
    });
  }

  showStatus(message, isError = false) {
    const statusEl = document.getElementById("statusMessage");
    statusEl.textContent = message;
    statusEl.style.color = isError ? "red" : "green";
  }

  resetForm() {
    document.getElementById("description").value = "";
    this.capturedBlob = null;
    const preview = document.getElementById("preview");
    preview.src = "";
    preview.style.display = "none";
    document.getElementById("lat").value = "";
    document.getElementById("lon").value = "";
  }

  navigateToHome() {
    window.location.hash = "/";
  }

  initMap() {
    // Load Leaflet CSS & JS kalau belum ada (pastikan sudah dimuat di index.html atau main app)
    // Inisialisasi peta dengan view default
    const map = L.map("map").setView([-6.2088, 106.8456], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    let marker;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      // Set input lat lon
      document.getElementById("lat").value = lat.toFixed(6);
      document.getElementById("lon").value = lng.toFixed(6);

      // Tambahkan marker atau pindahkan kalau sudah ada
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
    });
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
