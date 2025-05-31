import RegisterPresenter from "../../presenters/register-presenter";
import AuthModel from "../../data/auth-model";

export default class RegisterPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    return `
      <section class="register-main">
        <section class="register-section">
          <h1>Register for Story Explorer</h1>
          <form id="register-form" class="register-form">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required />

            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />

            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="8" />

            <button type="submit" class="register-button">Register</button>
          </form>

          <button id="go-login" class="register-handle" type="button">
            Sudah punya akun? Login di sini
          </button>

          <div id="register-error" class="error-message hidden" role="alert" aria-live="assertive"></div>
        </section>
      </section>
    `;
  }

  async afterRender() {
    const model = new AuthModel();
    this.presenter = new RegisterPresenter(this, model);

    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;

      await this.presenter.handleRegister({ name, email, password });
    });

    const loginButton = document.getElementById("go-login");
    loginButton.addEventListener("click", () => {
      window.location.hash = "/login";
    });
  }

  showError(message) {
    const errorBox = document.getElementById("register-error");
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
    }
  }

  redirectToLogin() {
    window.location.hash = "/login";
  }
}
