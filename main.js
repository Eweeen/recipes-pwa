// API
const url = "https://api.spoonacular.com/recipes/complexSearch";
const options = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
};
const apiKey = "8c3a43efa547436e8107e02f7266b1b6";
let currentRecipes = [];

// IndexedDB
const dbVersion = 2;
const dbName = "recipes";
const storeName = "favorites";
const storeKeyPath = "id";

// Utils
const location =
  document.location.origin +
  document.location.pathname.split("/").slice(0, -1).join("/");
let offset = 0;

/**
 * Open the IndexedDB database.
 *
 * @async
 * @returns {Promise<IDBDatabase>} - The IndexedDB database.
 */
async function openDB() {
  return await new Promise((resolve, reject) => {
    const req = window.indexedDB.open(dbName, dbVersion);

    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;

      if ([...db.objectStoreNames].includes(storeName)) {
        db.deleteObjectStore(storeName);
      }

      const store = db.createObjectStore(storeName, { keyPath: storeKeyPath });

      store.createIndex("title", "title", { unique: false });
      store.createIndex("image", "image", { unique: false });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a recipe by its ID.
 * 
 * @returns {Promise} - The recipes.
 */
async function getAll() {
  const transaction = (await openDB()).transaction([storeName], "readonly");

  return new Promise((resolve, reject) => {
    transaction.onerror = reject;
    const store = transaction.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a recipe by its ID.
 * 
 * @param {*} recipe - The recipe to add.
 * @returns {Promise} - The recipe.
 */
async function addRecipe(recipe) {
  const transaction = (await openDB()).transaction([storeName], "readwrite");

  return new Promise((resolve, reject) => {
    transaction.onerror = reject;
    const store = transaction.objectStore(storeName);
    const req = store.add({
      recipeID: recipe.id,
      title: recipe.title,
      image: recipe.image,
    });

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a recipe by its ID.
 * 
 * @param {*} id - The ID of the recipe.
 * @returns {Promise} - The recipe.
 */
async function deleteRecipe(id) {
  const transaction = (await openDB()).transaction([storeName], "readwrite");

  return new Promise((resolve, reject) => {
    transaction.onerror = reject;
    const store = transaction.objectStore(storeName);
    const req = store.delete(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetch recipes from the Spoonacular API.
 *
 * @async
 * @param {number} offset - The offset to fetch recipes from.
 * @returns {Promise} - The response from the API.
 */
async function fetchRecipes(offset) {
  const response = await fetch(
    `${url}?number=100&offset=${offset ?? 0}&apiKey=${apiKey}`,
    options
  );

  return response.json();
}

/**
 * Build the recipes and append them to the recipes container.
 *
 * @async
 * @param {*} recipes - The recipes to build.
 * @returns {void}
 */
async function buildRecipes(recipes) {
  const recipesContainer = document.getElementById("recipes");
  if (!recipesContainer) return;

  currentRecipes = recipes;

  // Get the bookmarked recipes.
  const bookmarks = await getAll();

  // Build the recipes.
  for (const recipe of recipes) {
    const isBookmarked = bookmarks.find((bookmark) => bookmark.recipeID === recipe.id);
    const src = getIcon(!!isBookmarked);

    buildRecipeCards(recipesContainer, recipe, src);
  }

  // Add event listeners to the bookmark icons.
  const icons = document.querySelectorAll(".bookmark");
  icons.forEach((bookmark) => {
    bookmark.addEventListener("click", handleBookmarkClick);
  });
}

/**
 * Build the pagination and append it to the pagination container.
 *
 * @param {*} recipes - The recipes to build the pagination from.
 * @returns {void}
 */
function buildPagination(recipes) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  const pages = Math.ceil(recipes.totalResults / recipes.number);
  const currentPage = recipes.offset / recipes.number + 1;

  // Build the pagination buttons.
  for (let i = 1; i <= pages; i++) {
    const page = document.createElement("button");
    page.textContent = i;
    page.classList.add("page");
    if (i === currentPage) page.classList.add("active");
    page.addEventListener("click", handlePageClick);
    pagination.appendChild(page);
  }
}

/**
 * Build the favorite recipes and append them to the favorites container.
 * 
 * @async
 * @returns {void}
 */
async function buildFavorites() {
  const container = document.getElementById("favorites");
  if (!container) return;

  const recipes = await getAll();

  if (recipes.length === 0) {
    container.innerHTML = '<p style="text-align: center">No favorite recipes found.</p>';
    return;
  }

  for (const recipe of recipes) {
    buildRecipeCards(container, recipe, `${location}/icons/bookmark-solid.svg`);
  }
}

/**
 * Handle the page click event.
 *
 * @async
 * @param {*} e - The event object.
 * @returns {void}
 */
async function handlePageClick(e) {
  const number = +e.target.textContent;
  offset = (number - 1) * 100;

  // Get the recipes from the API and build them.
  const recipes = await fetchRecipes(offset);
  const recipesContainer = document.getElementById("recipes");
  recipesContainer.innerHTML = "";
  buildRecipes(recipes.results);

  // Update the active page.
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => page.classList.remove("active"));
  e.target.classList.add("active");
}

/**
 * Handle the bookmark click event.
 *
 * @async
 * @param {*} e - The event object.
 * @returns {void}
 */
async function handleBookmarkClick(e) {
  const id = e.target.dataset.id;
  const bookmark = e.target;
  const isBookmarked = bookmark.src.includes("bookmark-solid.svg");

  if (isBookmarked) {
    await deleteRecipe(+id);
  } else {
    const recipe = currentRecipes.find((recipe) => recipe.id === +id);
    await addRecipe(recipe);
  }

  bookmark.src = getIcon(!isBookmarked);
}

/**
 * Get the image path for the bookmark icon.
 * 
 * @param {boolean} isBookmarked - Whether the recipe is bookmarked.
 * @returns {string} - The image path.
 */
function getIcon(isBookmarked) {
  return isBookmarked
    ? `${location}/icons/bookmark-solid.svg`
    : `${location}/icons/bookmark-regular.svg`;
}

/**
 * Build the recipe cards.
 * 
 * @param {HTMLElement} container - The container to append the recipe cards to.
 * @param {*} recipe - The recipe to build the card from.
 * @param {string} src - The image path for the bookmark icon.
 * @returns {void}
 */
function buildRecipeCards(container, recipe, src) {
  const recipeElement = document.createElement("div");
  recipeElement.classList.add("recipe");
  recipeElement.setAttribute("data-id", recipe.id);
  recipeElement.innerHTML = `
    <header>
      <h3>${recipe.title}</h3>
      <img data-id="${recipe.id}" src="${src}" alt="bookmark" class="bookmark" loading="lazy" />
    </header>
    <img src="${recipe.image}" alt="${recipe.title}" />
  `;

  container.appendChild(recipeElement);
}

function handleConnection() {
  const status = document.getElementById("connexion-indicator");
  if (!status) return;

  if (!navigator.onLine) status.style.display = "block";
}

window.addEventListener("load", async () => {
  const recipes = await fetchRecipes();

  buildRecipes(recipes.results);
  buildPagination(recipes);
  buildFavorites();
});

window.addEventListener('online', handleConnection);
window.addEventListener('offline', handleConnection);