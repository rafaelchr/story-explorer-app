export default class RegisterPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async handleRegister({ name, email, password }) {
    try {
      const result = await this.model.register(name, email, password);
      if (!result.error) {
        this.view.redirectToLogin();
      } else {
        this.view.showError(result.message);
      }
    } catch (err) {
      this.view.showError("Failed to register. Please try again.");
    }
  }
}
