class AddStoryPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async submitStory({ description, photo, lat, lon }) {
    this.view.showStatus("Submitting story...");

    if (!photo || !photo.type.startsWith("image/") || photo.size > 1048576) {
      this.view.showStatus("Invalid photo. Only image files under 1MB allowed.", true);
      return;
    }

    const result = await this.model.addStory({ description, photo, lat, lon });

    if (result.error) {
      this.view.showStatus(`Error: ${result.message}`, true);
    } else {
      this.view.showStatus("Story added successfully!");
      this.view.resetForm();
      setTimeout(() => this.view.navigateToHome(), 1500);
    }
  }
}

export default AddStoryPresenter;
