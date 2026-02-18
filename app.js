// Simple Netflix-style landing page using TMDB v3 API
// Docs: https://developer.themoviedb.org/reference/intro/getting-started

const TMDB_API_KEY = "REPLACE_WITH_YOUR_TMDB_API_KEY"; // <= put your key here
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const rowsContainer = document.getElementById("rows");
const heroSection = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroSubtitle = document.getElementById("hero-subtitle");

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

async function init() {
  if (!TMDB_API_KEY || TMDB_API_KEY === "REPLACE_WITH_YOUR_TMDB_API_KEY") {
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
  } catch (error) {
    console.error(error);
    const status = document.createElement("p");
    status.className = "rows__status";
    status.textContent = "Unable to load movies right now. Please try again later.";
    rowsContainer.appendChild(status);
  }
}

init();

