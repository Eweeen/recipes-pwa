const url = "https://api.spoonacular.com/recipes/";
const apiKey = "a332f95aa6a34c9e9bb282ec9507bbc5";

async function fetchRecipes() {
  const response = await fetch(`${url}random?number=100&apiKey=${apiKey}`, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return data.recipes;
}
