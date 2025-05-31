class AuthModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1";
  }

  async register(name, email, password) {
    const formData = {
      name,
      email,
      password,
    };

    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error register:", error);
      throw error;
    }
  }

  async login(email, password) {
    const credentials = {
      email,
      password,
    };

    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error login:", error);
      throw error;
    }
  }
}

export default AuthModel;
