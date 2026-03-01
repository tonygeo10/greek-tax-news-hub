 const API_URL = "https://greek-tax-api-1.onrender.com/news";

let currentPage = 1;
const limit = 10;
let totalPages = 1;
let infiniteMode = false;
let currentCategory = "";

async function loadNews(page = 1, append = false) {
  document.getElementById("loader").style.display = "block";

  let url = `${API_URL}?page=${page}&limit=${limit}`;
  if (currentCategory) {
    url += `&category=${currentCategory}`;
  }

  const res = await fetch(url);
  const result = await res.json();

  totalPages = Math.ceil(result.total / limit);
  currentPage = result.page;

  if (append) {
    renderNewsAppend(result.data);
  } else {
    renderNews(result.data);
  }

  renderPagination();
  document.getElementById("loader").style.display = "none";
}

function renderNews(data) {
  const container = document.getElementById("news");
  container.innerHTML = "";

  data.forEach(item => {
    container.innerHTML += `
      <div class="news-card">
        <a href="${item.link}" target="_blank">
          <h3>${item.title}</h3>
        </a>
        <div class="news-meta">
          ${item.category || ""} • ${item.published_at || ""}
        </div>
      </div>
    `;
  });
}

function renderNewsAppend(data) {
  const container = document.getElementById("news");

  data.forEach(item => {
    container.innerHTML += `
      <div class="news-card">
        <a href="${item.link}" target="_blank">
          <h3>${item.title}</h3>
        </a>
        <div class="news-meta">
          ${item.category || ""} • ${item.published_at || ""}
        </div>
      </div>
    `;
  });
}

function renderPagination() {
  if (infiniteMode) return;

  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => loadNews(currentPage - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => loadNews(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => loadNews(currentPage + 1);
  container.appendChild(nextBtn);
}

function toggleInfinite() {
  infiniteMode = !infiniteMode;
  document.getElementById("pagination").style.display =
    infiniteMode ? "none" : "block";
}

window.addEventListener("scroll", async () => {
  if (!infiniteMode) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    if (currentPage < totalPages) {
      currentPage++;
      await loadNews(currentPage, true);
    }
  }
});

document.getElementById("categoryFilter").addEventListener("change", e => {
  currentCategory = e.target.value;
  currentPage = 1;
  loadNews(1);
});

loadNews();
