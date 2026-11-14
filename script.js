const STORAGE_KEY = "my-personal-news-posts";
const ADMIN_PASSWORD = "change-me"; // <-- set your own password here

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminPanel = document.getElementById("adminPanel");
const postForm = document.getElementById("postForm");
const feed = document.getElementById("feed");
const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");

let isLoggedIn = false;

function getPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderPosts() {
  const posts = getPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!posts.length) {
    feed.innerHTML = `
      <div class="empty-state">
        No posts yet. Log in as admin and share your first update.
      </div>
    `;
    return;
  }

  feed.innerHTML = posts.map(post => `
    <article class="news-item">
      <div class="news-item-header">
        <div>
          <h3>${escapeHtml(post.title)}</h3>
          <div class="meta">
            <span>By You</span>
            <span>•</span>
            <span>${formatDate(post.createdAt)}</span>
          </div>
        </div>

        ${isLoggedIn ? `
          <button class="delete-btn" data-id="${post.id}">Delete</button>
        ` : ""}
      </div>

      <p>${escapeHtml(post.content).replace(/\n/g, "<br>")}</p>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function login() {
  const password = prompt("Enter admin password:");
  if (password === ADMIN_PASSWORD) {
    isLoggedIn = true;
    adminPanel.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    renderPosts();
  } else if (password !== null) {
    alert("Incorrect password.");
  }
}

function logout() {
  isLoggedIn = false;
  adminPanel.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  loginBtn.classList.remove("hidden");
  renderPosts();
}

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);

postForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!isLoggedIn) {
    alert("Please log in first.");
    return;
  }

  const title = postTitle.value.trim();
  const content = postContent.value.trim();

  if (!title || !content) {
    alert("Please fill in both title and story.");
    return;
  }

  const posts = getPosts();
  posts.push({
    id: Date.now().toString(),
    title,
    content,
    createdAt: new Date().toISOString()
  });

  savePosts(posts);
  postForm.reset();
  renderPosts();
});

feed.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".delete-btn");
  if (!deleteBtn) return;

  const id = deleteBtn.dataset.id;
  const posts = getPosts().filter(post => post.id !== id);

  savePosts(posts);
  renderPosts();
});

renderPosts();
