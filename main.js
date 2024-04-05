const url = "https://api.spoonacular.com/recipes/complexSearch";
const options = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
};
const apiKey = "8c3a43efa547436e8107e02f7266b1b6";
const location =
  document.location.origin +
  document.location.pathname.split("/").slice(0, -1).join("/");

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
 * @param {*} recipes - The recipes to build.
 * @returns {void}
 */
function buildRecipes(recipes) {
  const recipesContainer = document.getElementById("recipes");

  // Build the recipes.
  recipes.forEach((recipe) => {
    const recipeElement = document.createElement("div");
    recipeElement.classList.add("recipe");
    recipeElement.setAttribute("data-id", recipe.id);
    recipeElement.innerHTML = `
      <header>
        <h3>${recipe.title}</h3>
        <img data-id="${recipe.id}" src="${location}/icons/bookmark-regular.svg" alt="bookmark" class="bookmark" loading="lazy" />
      </header>
      <img src="${recipe.image}" alt="${recipe.title}" />
    `;
    recipesContainer.appendChild(recipeElement);
  });

  // Add event listeners to the bookmark icons.
  const bookmarks = document.querySelectorAll(".bookmark");
  bookmarks.forEach((bookmark) => {
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
  const pages = Math.ceil(recipes.totalResults / recipes.number);
  const currentPage = recipes.offset / recipes.number + 1;
  const pagination = document.getElementById("pagination");

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

let offset = 0;

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
    bookmark.src = `${location}/icons/bookmark-regular.svg`;
    return;
  }

  bookmark.src = `${location}/icons/bookmark-solid.svg`;
}

window.addEventListener("load", async () => {
  const recipes = await fetchRecipes();

  buildRecipes(recipes.results);
  buildPagination(recipes);
});
