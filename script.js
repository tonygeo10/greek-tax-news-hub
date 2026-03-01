 const API_URL = "https://greek-tax-api-1.onrender.com/api/articles";

let currentPage = 1;
let currentCategory = "";

async function loadArticles(category = currentCategory) {
  currentCategory = category;
  currentPage = 1;
  fetchArticles();
}

async function fetchArticles() {
  let url = `${API_URL}?page=${currentPage}`;
  if (currentCategory) {
    url += `&category=${currentCategory}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  const container = document.getElementById("news-container");
  container.innerHTML = "";

  data.forEach(article => {
    const div = document.createElement("div");
    div.className = "news-card";

    div.innerHTML = `
      <h3>${article.title}</h3>
      <p>${article.category} | ${article.source}</p>
      <a href="${article.link}" target="_blank">Διάβασε περισσότερα</a>
    `;

    container.appendChild(div);
  });

  document.getElementById("pageInfo").innerText = `Σελίδα ${currentPage}`;
  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = data.length < 10;
}

function changePage(step) {
  currentPage += step;
  fetchArticles();
}

fetchArticles();
