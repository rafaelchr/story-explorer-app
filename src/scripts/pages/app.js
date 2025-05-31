import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  // Tambahkan properti untuk menyimpan instance halaman aktif
  #activePageInstance = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    let routeConfig = routes[url];

    // Handle dynamic route seperti '/detail/:id'
    if (!routeConfig) {
      const matchedKey = Object.keys(routes).find((key) => {
        const regex = new RegExp(
          `^${key.replace(/:[a-zA-Z0-9_]+/g, "([a-zA-Z0-9_]+)")}$`
        );
        return regex.test(url);
      });

      if (matchedKey) {
        routeConfig = routes[matchedKey];
        const PageClass = routeConfig.page.constructor;
        routeConfig = { ...routeConfig, page: new PageClass() };
      }
    }

    if (!routeConfig) {
      this.#content.innerHTML = "<h1>404 - Page Not Found</h1>";
      return;
    }

    // ✅ Route guard
    if (routeConfig.authRequired && !isLoggedIn()) {
      window.location.hash = "/login";
      return;
    }

    if (routeConfig.guestOnly && isLoggedIn()) {
      window.location.hash = "/";
      return;
    }

    // ✅ Handle khusus untuk /logout
    if (typeof routeConfig.handle === "function") {
      await routeConfig.handle();
      return;
    }

    const page = routeConfig.page;

    // ✅ Cleanup halaman sebelumnya
    if (this.#activePageInstance?.cleanup instanceof Function) {
      this.#activePageInstance.cleanup();
    }

    this.#activePageInstance = page;

    if ("startViewTransition" in document) {
      document.startViewTransition(async () => {
        await this.#updatePageContent(page);
        this.#setLayoutVisibility(window.location.hash);
      });
    } else {
      await this.#updatePageContent(page);
      this.#setLayoutVisibility(window.location.hash);
    }
  }

  async #updatePageContent(page) {
    this.#content.innerHTML = await page.render();
    await page.afterRender();
  }

  #setLayoutVisibility(url) {
    const hiddenRoutes = ["#/login", "#/register"];
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");

    if (hiddenRoutes.includes(url)) {
      header.style.display = "none";
      footer.style.display = "none";
    } else {
      header.style.display = "";
      footer.style.display = "";
    }
  }
}

function isLoggedIn() {
  return !!localStorage.getItem("authToken");
}

export default App;
