import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/auth/login-page';
import AddStoryPage from '../pages/add/add-story-page';
import DetailStoryPage from '../pages/detail/detail-story-page';
import RegisterPage from '../pages/auth/register-page';

const routes = {
  '/': { page: new HomePage(), authRequired: true },
  '/login': { page: new LoginPage(), guestOnly: true },
  '/register': { page: new RegisterPage(), guestOnly: true },
  '/add-story': { page: new AddStoryPage(), authRequired: true },
  '/detail/:id': { page: new DetailStoryPage(), authRequired: true },
  '/logout': {
    handle: async () => {
      localStorage.removeItem("authToken");
      window.location.hash = '/login';
    }
  }
};

export default routes;
