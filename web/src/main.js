// App entry: starts auth and loads saved content, then wires the router to the page outlet, navigation and search.
import './styles/main.css';
import { requireLogin } from './config.js';
import { startRouter, resolve } from './app/router.js';
import { setReturnTo } from './app/navigation.js';
import { initAuth, currentUser, onAuthChange, isAdmin } from './lib/auth/index.js';
import { loadContent } from './data/index.js';
import { toast } from './components/toast.js';
import { useProgressFor, syncProgress } from './lib/progress.js';
import { renderNav } from './components/nav.js';
import { setupSearch } from './components/search.js';
import { renderUserMenu, setupUserMenu } from './components/user-menu.js';

const outlet = document.getElementById('view');
let cleanup = null;
let current = null;

// Sends people to the right place before a page renders. Returns false when it redirected.
function guard(route) {
  const user = currentUser();
  const needsAccount = route.auth || (requireLogin && route.layout !== 'auth');
  if (needsAccount && !user) {
    setReturnTo(location.hash);
    location.replace('#/login');
    return false;
  }
  if (route.admin && !isAdmin(user)) {
    toast('The admin dashboard is for admins only.');
    location.replace('#/');
    return false;
  }
  if (route.guestOnly && user) {
    location.replace('#/');
    return false;
  }
  return true;
}

function renderChrome(route) {
  document.body.classList.toggle('auth-mode', route.layout === 'auth');
  if (route.layout === 'auth') return;
  renderNav(route);
  renderUserMenu();
}

function show(route, { scroll = true } = {}) {
  if (!guard(route)) return;
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  current = route;

  outlet.innerHTML = route.page.render(route.params);
  renderChrome(route);
  const rerender = () => show(route, { scroll: false });
  Promise.resolve(route.page.mount?.(outlet, route.params, { rerender })).then((fn) => {
    cleanup = fn;
  });
  if (scroll) window.scrollTo(0, 0);
}

// Shown when the API cannot be reached at startup.
function showStartError(error) {
  document.body.classList.add('auth-mode');
  outlet.innerHTML = `<section class="auth-main"><div class="auth-card">
    <div class="auth-head"><h1>Prep Desk could not start</h1></div>
    <p class="notice" role="alert">${error.status >= 500 ? 'The server hit an error while loading content. Check the API terminal for details.' : 'The app could not reach the API. If you are running it locally, start it with <code>npm run dev</code> from the project folder.'}</p>
    <button class="btn btn-block" type="button" onclick="location.reload()">Try again</button>
  </div></section>`;
}

// Loads the account's progress from the API and refreshes the page if anything changed.
async function pullProgress() {
  await syncProgress();
  if (current && current.layout !== 'auth') show(resolve(location.hash), { scroll: false });
}

async function start() {
  let user;
  try {
    // The backend has to exist before content can load, so these run in order.
    user = await initAuth();
    await loadContent();
  } catch (e) {
    console.error(e);
    return showStartError(e);
  }
  useProgressFor(user?.id);

  onAuthChange((u) => {
    useProgressFor(u?.id);
    if (u) pullProgress();
    // Logging out on an account-only page goes home rather than to the login screen.
    if (!u && (current?.auth || requireLogin)) {
      location.replace(requireLogin ? '#/login' : '#/');
      return;
    }
    // Auth pages navigate on their own after success; elsewhere refresh the page so names and progress update.
    if (current && current.layout !== 'auth') show(resolve(location.hash), { scroll: false });
  });

  setupSearch();
  setupUserMenu();
  startRouter((route) => show(route));
  if (user) pullProgress();
}

start();
