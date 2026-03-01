const toggle = document.getElementById("themeToggle");
const body = document.body;

toggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  toggle.textContent = body.classList.contains("dark") ? "☀️" : "🌙";
});

/* Example rendering */
function renderNews(news) {
  const container = document.getElementById("newsContainer");
  container.innerHTML = "";

  news.forEach(item => {
    container.innerHTML += `
      <div class="card">
        <a href="${item.link}" target="_blank">${item.title}</a>

        <div class="meta-row">
          <span class="badge">${item.category || "general"}</span>

          <div class="source">
            <img src="https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}">
            ${item.source}
          </div>
        </div>
      </div>
    `;
  });
}
