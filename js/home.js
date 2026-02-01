const BASE_API = "https://dummyjson.com/products";
const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";

let allProducts = [];
let filteredProducts = [];
let displayedCount = 0;
const PAGE_SIZE = 12;
let sliderIndex = 0;
let sliderItems = [];

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  loadProducts();
  initSliderControls();
  initSorting();
  initCategories();
  initHeaderScroll();
});

/* ===================== AUTH ===================== */

function initAuth() {
  const user = sessionStorage.getItem("currentUser");
  const accountBtn = document.getElementById("accountBtn");
  const accountLabel = document.getElementById("accountLabel");
  const ordersBtn = document.getElementById("ordersBtn");

  if (user) {
    const currentUser = JSON.parse(user);

    if (ordersBtn) {
      ordersBtn.style.display = "flex";
      ordersBtn.onclick = () => (window.location.href = "orders.html");
    }

    accountLabel.innerText = "Logout";
    accountBtn.onclick = () => {
      sessionStorage.removeItem("currentUser");
      window.location.reload();
    };

    updateHeaderCartCount(currentUser.id);
  } else {
    if (ordersBtn) ordersBtn.style.display = "none";
    accountLabel.innerText = "Login";
    accountBtn.onclick = () => (window.location.href = "login.html");
    document.getElementById("cartBadge").innerText = "0";
  }
}

/* ===================== PRODUCTS ===================== */

async function loadProducts() {
  try {
    const res = await fetch(BASE_API);
    const data = await res.json();

    allProducts = data.products;
    filteredProducts = [...allProducts];
    sliderItems = allProducts.slice(0, 10);

    renderSlider(sliderItems);
    renderProducts(true);
    hideLoader();
  } catch (err) {
    console.error("Failed to load products:", err);
    hideLoader();
  }
}

async function searchProducts(query) {
  if (!query.trim()) {
    filteredProducts = [...allProducts];
    renderProducts(true);
    return;
  }

  try {
    const res = await fetch(`${BASE_API}/search?q=${query}`);
    const data = await res.json();

    filteredProducts = data.products;
    renderProducts(true);
  } catch (err) {
    console.error("Search error:", err);
  }
}

/* ===================== SEARCH ===================== */

document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("searchBox");
  let debounceTimer;

  searchBox.addEventListener("keyup", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchProducts(e.target.value);
    }, 400);
  });
});

/* ===================== CATEGORIES ===================== */

function initCategories() {
  const pills = document.querySelectorAll(".cat-pill");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      const cat = pill.dataset.cat;

      if (cat === "all") {
        filteredProducts = [...allProducts];
      } else {
        filteredProducts = allProducts.filter(
          (p) => p.category && p.category.toLowerCase().includes(cat.toLowerCase())
        );
      }

      applySorting();
      renderProducts(true);
    });
  });
}

/* ===================== SORTING ===================== */

function initSorting() {
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    applySorting(e.target.value);
    renderProducts(true);
  });
}

function applySorting(val) {
  const sortVal = val || document.getElementById("sortSelect").value;

  switch (sortVal) {
    case "price-low":
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filteredProducts.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }
}

/* ===================== RENDER SLIDER ===================== */

function renderSlider(products) {
  const track = document.getElementById("sliderContainer");
  track.innerHTML = "";

  products.forEach((p) => {
    const discount = p.discountPercentage ? Math.round(p.discountPercentage) : Math.floor(Math.random() * 25 + 5);
    const oldPrice = (p.price / (1 - discount / 100)).toFixed(2);
    const stars = p.rating ? "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating)) : "★★★★☆";

    track.innerHTML += `
      <div class="slider-item" onclick="viewProduct(${p.id})">
        <span class="deal-badge">-${discount}%</span>
        <img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
        <div class="slider-item-info">
          <h4>${p.title}</h4>
          <div>
            <span class="price">₹${p.price}</span>
            <span class="price-old">₹${oldPrice}</span>
          </div>
          <div class="rating"><span class="star">${stars.slice(0, 5)}</span> ${p.rating || 4.2}</div>
        </div>
      </div>
    `;
  });
}

/* ===================== RENDER PRODUCTS ===================== */

function renderProducts(reset = false) {
  const grid = document.getElementById("productGrid");
  const countEl = document.getElementById("productCount");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (reset) {
    grid.innerHTML = "";
    displayedCount = 0;
  }

  const end = Math.min(displayedCount + PAGE_SIZE, filteredProducts.length);
  const batch = filteredProducts.slice(displayedCount, end);
  displayedCount = end;

  countEl.innerText = `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`;

  batch.forEach((p, i) => {
    const discount = p.discountPercentage ? Math.round(p.discountPercentage) : Math.floor(Math.random() * 20 + 5);
    const oldPrice = (p.price / (1 - discount / 100)).toFixed(2);
    const starsCount = p.rating ? Math.round(p.rating) : 4;
    const stars = "★".repeat(starsCount) + "☆".repeat(5 - starsCount);

    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
        <button class="card-wishlist" onclick="event.stopPropagation()">♡</button>
        <div class="card-rating"><span class="star">★</span> ${p.rating || 4.2} <span style="color:var(--clr-muted);font-weight:400;">(${Math.floor(Math.random()*400+20)})</span></div>
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand || "ShopX Original"}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-price-row">
          <span class="card-price">₹${p.price}</span>
          <span class="card-price-old">₹${oldPrice}</span>
          <span class="card-discount">-${discount}%</span>
        </div>
        <button class="card-btn" onclick="viewProduct(${p.id})">View Product</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Show/hide load more
  loadMoreBtn.style.display = displayedCount < filteredProducts.length ? "inline-flex" : "none";
}

/* ===================== LOAD MORE ===================== */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    renderProducts(false);
  });
});

/* ===================== SLIDER CONTROLS ===================== */

function initSliderControls() {
  const track = document.getElementById("sliderContainer");
  const prev = document.getElementById("sliderPrev");
  const next = document.getElementById("sliderNext");

  prev.addEventListener("click", () => slideBy(-1));
  next.addEventListener("click", () => slideBy(1));
}

function slideBy(dir) {
  const track = document.getElementById("sliderContainer");
  const maxScroll = track.scrollWidth - track.clientWidth;

  if (maxScroll <= 0) return;

  const stepSize = track.clientWidth * 0.55;
  track.scrollLeft = Math.max(0, Math.min(track.scrollLeft + dir * stepSize, maxScroll));
}

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("sliderContainer");
  track.style.scrollBehavior = "smooth";
});

/* ===================== NAVIGATION ===================== */

function viewProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

/* ===================== CART COUNT (SheetDB) ===================== */

async function updateHeaderCartCount(userId) {
  try {
    const res = await fetch(
      `${SHEETDB_BASE}/search?sheet=cart&userId=${userId}`
    );
    const cartItems = await res.json();

    const totalQty = cartItems.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );

    document.getElementById("cartBadge").innerText = totalQty;
  } catch (err) {
    console.error("Cart count error:", err);
    document.getElementById("cartBadge").innerText = "0";
  }
}

/* ===================== HEADER SCROLL EFFECT ===================== */

function initHeaderScroll() {
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  });
}

/* ===================== PAGE LOADER ===================== */

function hideLoader() {
  const loader = document.getElementById("pageLoader");
  if (loader) loader.classList.add("done");
}

// Safety fallback — hide loader after 2.5s no matter what
setTimeout(() => {
  const loader = document.getElementById("pageLoader");
  if (loader) loader.classList.add("done");
}, 2500);