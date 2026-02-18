// Simple Netflix-style landing page using TMDB v3 API
// Docs: https://developer.themoviedb.org/reference/intro/getting-started

const TMDB_API_KEY = "REPLACE_WITH_YOUR_TMDB_API_KEY"; // <= put your key here
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const rowsContainer = document.getElementById("rows");
const heroSection = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroSubtitle = document.getElementById("hero-subtitle");

// Auth modal elements
const authOverlay = document.getElementById("auth-overlay");
const authCloseBtn = document.getElementById("auth-close");
const authTabs = document.querySelectorAll(".auth-modal__tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.querySelector(".auth-modal__subtitle");
const navSigninBtn = document.querySelector(".nav__button--signin");
const heroPrimaryBtn = document.querySelector(".btn--primary");

if (!TMDB_API_KEY || TMDB_API_KEY === "REPLACE_WITH_YOUR_TMDB_API_KEY") {
  const warning = document.createElement("p");
  warning.className = "rows__status";
  warning.textContent =
    "Configure TMDB_API_KEY in app.js to load movie data from The Movie Database.";
  rowsContainer.appendChild(warning);
}

const ROW_DEFINITIONS = [
  { title: "Trending Now", path: "/trending/movie/week" },
  { title: "Popular on Netflix", path: "/movie/popular" },
  { title: "Top Rated", path: "/movie/top_rated" },
  { title: "Now Playing in Theatres", path: "/movie/now_playing" },
];

async function fetchTMDB(path) {
  const url = new URL(TMDB_BASE_URL + path);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status}`);
  }
  return res.json();
}

function createPosterCard(movie) {
  const posterPath = movie.poster_path || movie.backdrop_path;

  const card = document.createElement("article");
  card.className = "poster";

  if (posterPath) {
    const img = document.createElement("img");
    img.className = "poster__image";
    img.src = TMDB_IMAGE_BASE + posterPath;
    img.alt = movie.title || movie.name || "Movie poster";
    card.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "poster__fallback";
    fallback.textContent = movie.title || movie.name || "Untitled";
    card.appendChild(fallback);
  }

  const title = document.createElement("div");
  title.className = "poster__title";
  title.textContent = movie.title || movie.name || "";
  card.appendChild(title);

  return card;
}

function renderRow(rowTitle, movies) {
  const row = document.createElement("section");
  row.className = "row";

  const titleEl = document.createElement("h2");
  titleEl.className = "row__title";
  titleEl.textContent = rowTitle;

  const track = document.createElement("div");
  track.className = "row__track";

  movies.forEach((movie) => {
    track.appendChild(createPosterCard(movie));
  });

  row.appendChild(titleEl);
  row.appendChild(track);
  rowsContainer.appendChild(row);
}

function setHeroFromMovie(movie) {
  const backdrop = movie.backdrop_path || movie.poster_path;
  if (backdrop) {
    heroSection.style.backgroundImage = `url(${TMDB_IMAGE_BASE}${backdrop})`;
  }

  heroTitle.textContent = movie.title || movie.name || "Unlimited movies, TV shows and more";

  const overview = (movie.overview || "").trim();
  heroSubtitle.textContent = overview || "Watch anywhere. Cancel anytime.";
}

function showAuthMessage(text, type) {
  authMessage.textContent = text || "";
  authMessage.classList.remove("auth-modal__message--error", "auth-modal__message--success");
  if (type === "error") {
    authMessage.classList.add("auth-modal__message--error");
  } else if (type === "success") {
    authMessage.classList.add("auth-modal__message--success");
  }
}

function setAuthMode(mode) {
  const isLogin = mode === "login";

  authTabs.forEach((tab) => {
    const tabMode = tab.dataset.mode;
    tab.classList.toggle("auth-modal__tab--active", tabMode === mode);
    tab.setAttribute("aria-selected", tabMode === mode ? "true" : "false");
  });

  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;

  if (isLogin) {
    authTitle.textContent = "Welcome back";
    authSubtitle.textContent = "Sign in to continue watching.";
  } else {
    authTitle.textContent = "Create your account";
    authSubtitle.textContent = "Register to start building your watchlist.";
  }

  showAuthMessage("", null);
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  authOverlay.classList.add("auth-overlay--visible");
  authOverlay.setAttribute("aria-hidden", "false");

  const firstInput = (mode === "login"
    ? loginForm.querySelector("input")
    : registerForm.querySelector("input"));
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

function closeAuth() {
  authOverlay.classList.remove("auth-overlay--visible");
  authOverlay.setAttribute("aria-hidden", "true");
  showAuthMessage("", null);
  loginForm.reset();
  registerForm.reset();
}

function handleRegisterSubmit(event) {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const userId = String(formData.get("userId") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

  if (!userId || !username || !email || !phone || !password) {
    showAuthMessage("Please fill in all fields.", "error");
    return;
  }

  fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, username, email, phone, password }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }
      showAuthMessage(data.message || "Account created. You can now log in.", "success");
      registerForm.reset();
      setTimeout(() => setAuthMode("login"), 900);
    })
    .catch((err) => {
      showAuthMessage(err.message || "Unable to register right now.", "error");
    });
}

function handleLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    showAuthMessage("Enter your username and password.", "error");
    return;
  }

  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }
      showAuthMessage("Login successful. Redirecting…", "success");
      setTimeout(() => {
        window.location.href = "https://tmdb-netflix-landing.vercel.app/";
      }, 900);
    })
    .catch((err) => {
      showAuthMessage(err.message || "Unable to log in right now.", "error");
    });
}

function setupAuthUI() {
  if (!authOverlay) return;

  // Openers
  if (navSigninBtn) {
    navSigninBtn.addEventListener("click", () => openAuth("login"));
  }
  if (heroPrimaryBtn) {
    heroPrimaryBtn.addEventListener("click", () => openAuth("register"));
  }

  // Close button and overlay click
  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", closeAuth);
  }
  authOverlay.addEventListener("click", (event) => {
    if (event.target === authOverlay) {
      closeAuth();
    }
  });

  // Tabs
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.mode === "register" ? "register" : "login";
      setAuthMode(mode);
    });
  });

  // Inline small "switch" links
  document.querySelectorAll(".auth-switch [data-switch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.switch === "register" ? "register" : "login";
      setAuthMode(mode);
    });
  });

  // Submit handlers
  registerForm.addEventListener("submit", handleRegisterSubmit);
  loginForm.addEventListener("submit", handleLoginSubmit);

  // Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && authOverlay.classList.contains("auth-overlay--visible")) {
      closeAuth();
    }
  });
}

async function init() {
  if (!TMDB_API_KEY || TMDB_API_KEY === "REPLACE_WITH_YOUR_TMDB_API_KEY") {
    // Even without TMDB configured, still enable auth UI.
    setupAuthUI();
    return;
  }

  try {
    // Fetch trending first for hero
    const trending = await fetchTMDB("/trending/movie/week");
    const trendingResults = Array.isArray(trending.results) ? trending.results : [];
    if (trendingResults.length > 0) {
      setHeroFromMovie(trendingResults[0]);
    }

    // Build rows in parallel
    const promises = ROW_DEFINITIONS.map((def) =>
      fetchTMDB(def.path)
        .then((data) => {
          const items = Array.isArray(data.results) ? data.results.slice(0, 20) : [];
          if (items.length > 0) {
            renderRow(def.title, items);
          }
        })
        .catch((err) => {
          console.error(`Error loading row "${def.title}":`, err);
        })
    );

    await Promise.all(promises);

    // Set up auth after content loads
    setupAuthUI();
  } catch (error) {
    console.error(error);
    const status = document.createElement("p");
    status.className = "rows__status";
    status.textContent = "Unable to load movies right now. Please try again later.";
    rowsContainer.appendChild(status);

    setupAuthUI();
  }
}

init();

