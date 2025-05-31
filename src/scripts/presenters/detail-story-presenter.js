export default class DetailStoryPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async loadStory(id) {
    try {
      const data = await this.model.getStoryById(id);
      this.view.showStory(data.story);
    } catch (err) {
      this.view.showError(err.message || "Failed to load story");
    }
  }
}
