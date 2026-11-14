const supabaseUrl = "https://fszcioyyonupalpzyspk.supabase.co";
const supabaseKey = "sb_publishable_LcWzUCvGDxFHFX1Y4Y1pkw_DNR4Kdq1";
const ownerUserId = "4556a626-a888-44fe-ae4e-c876296dad09";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminPanel = document.getElementById("adminPanel");
const postForm = document.getElementById("postForm");
const feed = document.getElementById("feed");
const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");

let isLoggedIn = false;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function updateLoginUI(session) {
  isLoggedIn = session?.user?.id === ownerUserId;

  adminPanel.classList.toggle("hidden", !isLoggedIn);
  logoutBtn.classList.toggle("hidden", !isLoggedIn);
  loginBtn.classList.toggle("hidden", isLoggedIn);
}

async function refreshPosts() {
  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select("id, title, content, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load posts:", error);
    feed.innerHTML = `
      <div class="empty-state">
        Could not load posts. Please try again later.
      </div>
    `;
    return;
  }

  if (!posts || posts.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        No posts yet.
      </div>
    `;
    return;
  }

  feed.innerHTML = posts.map((post) => `
    <article class="news-item">
      <div class="news-item-header">
        <div>
          <h3>${escapeHtml(post.title)}</h3>
          <div class="meta">
            <span>By You</span>
            <span>•</span>
            <span>${formatDate(post.created_at)}</span>
          </div>
        </div>

        ${isLoggedIn
          ? `<button class="delete-btn" data-id="${escapeHtml(post.id)}">Delete</button>`
          : ""}
      </div>

      <p>${escapeHtml(post.content).replace(/\n/g, "<br>")}</p>
    </article>
  `).join("");
}

async function login() {
  const email = prompt("Enter your Supabase email:");
  if (!email) return;

  const password = prompt("Enter your Supabase password:");
  if (!password) return;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user?.id !== ownerUserId) {
    await supabaseClient.auth.signOut();
    alert("That account is not authorized to manage this site.");
    return;
  }

  updateLoginUI(data);
  await refreshPosts();
}

async function logout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  updateLoginUI(null);
  await refreshPosts();
}

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();

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

  const submitButton = postForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await supabaseClient
    .from("posts")
    .insert([{ title, content }]);

  submitButton.disabled = false;

  if (error) {
    alert(error.message);
    return;
  }

  postForm.reset();
  await refreshPosts();
});

feed.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".delete-btn");
  if (!deleteButton || !isLoggedIn) return;

  if (!confirm("Delete this post?")) return;

  const { error } = await supabaseClient
    .from("posts")
    .delete()
    .eq("id", deleteButton.dataset.id);

  if (error) {
    alert(error.message);
    return;
  }

  await refreshPosts();
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  updateLoginUI(session);
});

async function initialize() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Could not check login status:", error);
    updateLoginUI(null);
  } else {
    updateLoginUI(data.session);
  }

  await refreshPosts();
}

initialize();
