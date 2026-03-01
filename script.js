const API = "https://greek-tax-api-1.onrender.com/api/articles";

let currentPage = 1;
let totalPages = 1;

async function fetchNews(page = 1) {
  const res = await fetch(`${API}?page=${page}`);
  const data = await res.json();
console.log(data);
  const container = document.getElementById("news-container");
  container.innerHTML = "";

  data.articles.forEach(article => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="badge">${article.category || "General"}</div>
      <h3>${article.title}</h3>
      <div class="meta">${article.source}</div>
      <a href="${article.link}" target="_blank">Διαβάστε περισσότερα →</a>
    `;

    container.appendChild(card);
  });

  currentPage = data.page;
  totalPages = data.total_pages;

  document.getElementById("pageInfo").innerText =
    `Σελίδα ${currentPage} από ${totalPages}`;

  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage === totalPages;
}

document.getElementById("prevBtn").onclick = () => {
  if (currentPage > 1) fetchNews(currentPage - 1);
};

document.getElementById("nextBtn").onclick = () => {
  if (currentPage < totalPages) fetchNews(currentPage + 1);
};

document.getElementById("darkToggle").onclick = () => {
  document.body.classList.toggle("light");
};

fetchNews();
