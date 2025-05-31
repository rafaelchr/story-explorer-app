export default class LoginPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async handleLogin(email, password) {
    try {
      const result = await this.model.login(email, password);
      if (!result.error) {
        localStorage.setItem('authToken', result.loginResult.token);
        this.view.redirectToHome();
      } else {
        this.view.showError(result.message);
      }
    } catch (err) {
      this.view.showError('Failed to login. Please try again.');
    }
  }
}
