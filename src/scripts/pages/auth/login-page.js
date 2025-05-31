import LoginPresenter from '../../presenters/login-presenter';
import AuthModel from '../../data/auth-model';

export default class LoginPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    return `
      <section class="login-main">
        <section class="login-section">
          <h1>Login to Story Explorer</h1>
          <form id="login-form" class="login-form">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />

            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="8" />

            <button type="submit" class="login-button">Login</button>
          </form>

          <button id="go-register" class="register-handle" type="button">
            Belum punya akun? Register di sini
          </button>

          <div id="login-error" class="error-message hidden" role="alert" aria-live="assertive"></div>
        </section>
      </section>
    `;
  }

  async afterRender() {
    const model = new AuthModel();
    this.presenter = new LoginPresenter(this, model);

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      await this.presenter.handleLogin(email, password);
    });

    const registerButton = document.getElementById('go-register');
    registerButton.addEventListener('click', () => {
      window.location.hash = '/register';
    });
  }

  showError(message) {
    const errorBox = document.getElementById('login-error');
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
    }
  }

  redirectToHome() {
    window.location.hash = '/';
  }
}
