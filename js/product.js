const API = "https://dummyjson.com/products";
const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let quantity = 1;
let currentUser = null;
let currentProduct = null;

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initQuantityControls();

  document.getElementById("addToCartBtn").onclick = addToCart;
  document.getElementById("buyNowBtn").onclick = buyNow;
  document.getElementById("wishlistBtn").onclick = toggleWishlist;

  if (productId) {
    loadProduct(productId);
  } else {
    hideLoader();
  }

  // Safety loader fallback
  setTimeout(hideLoader, 3000);
});

/* ===================== AUTH ===================== */

function initAuth() {
  const user = sessionStorage.getItem("currentUser");
  if (user) currentUser = JSON.parse(user);

  const ordersBtn = document.getElementById("ordersBtn");
  if (currentUser && ordersBtn) {
    ordersBtn.style.display = "flex";
    ordersBtn.onclick = () => (window.location.href = "orders.html");
  }

  document.getElementById("cartBtn").onclick = () => {
    window.location.href = currentUser ? "cart.html" : "login.html?redirect=cart.html";
  };

  updateHeaderCartCount();
}

/* ===================== QUANTITY CONTROLS ===================== */

function initQuantityControls() {
  document.getElementById("increaseQty").onclick = () => {
    quantity++;
    document.getElementById("qtyInput").value = quantity;
  };

  document.getElementById("decreaseQty").onclick = () => {
    if (quantity > 1) quantity--;
    document.getElementById("qtyInput").value = quantity;
  };

  document.getElementById("qtyInput").oninput = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    quantity = val;
    e.target.value = val;
  };
}

/* ===================== LOAD PRODUCT ===================== */

async function loadProduct(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    currentProduct = await res.json();

    renderProduct(currentProduct);
    loadRelatedProducts(currentProduct.category);
    hideLoader();
  } catch (err) {
    console.error("Failed to load product:", err);
    hideLoader();
  }
}

function renderProduct(p) {
  // Title & breadcrumb
  document.getElementById("productTitle").innerText = p.title;
  document.getElementById("bcProduct").innerText = p.title.length > 28 ? p.title.slice(0, 25) + "…" : p.title;
  document.title = `${p.title} – ShopX`;

  // Brand
  document.getElementById("productBrand").innerText = p.brand || "ShopX Original";

  // Description
  document.getElementById("productDescription").innerText = p.description;

  // Stars
  renderStars(p.rating || 4.2);
  document.getElementById("productRatingNum").innerText = (p.rating || 4.2).toFixed(1);
  document.getElementById("productRatingCount").innerText = `(${Math.floor(Math.random() * 800 + 50)} reviews)`;

  // Price
  const discount = p.discountPercentage ? Math.round(p.discountPercentage) : Math.floor(Math.random() * 25 + 8);
  const oldPrice = (p.price / (1 - discount / 100)).toFixed(2);

  document.getElementById("productPrice").innerText = `₹${p.price}`;
  document.getElementById("productPriceOld").innerText = `₹${oldPrice}`;
  document.getElementById("productDiscount").innerText = `-${discount}%`;

  // Main image
  const mainImg = document.getElementById("mainProductImage");
  mainImg.src = p.thumbnail;

  // Thumbnails
  const thumbList = document.getElementById("thumbnailList");
  thumbList.innerHTML = "";

  const images = p.images && p.images.length > 0
    ? [p.thumbnail, ...p.images.filter(i => i !== p.thumbnail)]
    : [p.thumbnail];

  images.forEach((img, i) => {
    const el = document.createElement("img");
    el.src = img;
    el.alt = `Thumbnail ${i + 1}`;
    if (i === 0) el.classList.add("active");
    el.onclick = () => {
      mainImg.src = img;
      thumbList.querySelectorAll("img").forEach(t => t.classList.remove("active"));
      el.classList.add("active");
    };
    thumbList.appendChild(el);
  });

  // Features (auto-generated from product tags or category)
  renderFeatures(p);
}

/* ===================== STARS ===================== */

function renderStars(rating) {
  const container = document.getElementById("productStars");
  container.innerHTML = "";
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;

  for (let i = 0; i < 5; i++) {
    const star = document.createElement("span");
    star.className = "star";
    if (i < full) {
      star.classList.add("filled");
      star.innerText = "★";
    } else if (i === full && hasHalf) {
      star.classList.add("half");
      star.innerText = "★";
    } else {
      star.innerText = "☆";
    }
    container.appendChild(star);
  }
}

/* ===================== FEATURES ===================== */

function renderFeatures(p) {
  const container = document.getElementById("productFeatures");
  container.innerHTML = "";

  // Build feature list from tags or generate smart ones
  let features = [];
  if (p.tags && p.tags.length > 0) {
    features = p.tags.slice(0, 4).map(t => capitalize(t));
  }

  // Add some universal trust features
  const extras = ["High-quality materials", "Manufacturer warranty included", "Verified by ShopX"];
  features = [...features, ...extras].slice(0, 5);

  features.forEach(f => {
    container.innerHTML += `
      <div class="feature-item">
        <div class="feature-check">✓</div>
        <span>${f}</span>
      </div>
    `;
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

/* ===================== WISHLIST ===================== */

function toggleWishlist() {
  const btn = document.getElementById("wishlistBtn");
  btn.classList.toggle("active");
}

/* ===================== RELATED PRODUCTS ===================== */

async function loadRelatedProducts(category) {
  try {
    const res = await fetch(`${API}/category/${encodeURIComponent(category)}`);
    const data = await res.json();

    // Filter out the current product and limit to 4
    const related = data.products
      .filter(p => String(p.id) !== String(productId))
      .slice(0, 4);

    renderRelated(related);
  } catch (err) {
    console.error("Related products error:", err);
  }
}

function renderRelated(products) {
  const grid = document.getElementById("relatedGrid");
  grid.innerHTML = "";

  products.forEach((p, i) => {
    const discount = p.discountPercentage ? Math.round(p.discountPercentage) : Math.floor(Math.random() * 20 + 5);
    const oldPrice = (p.price / (1 - discount / 100)).toFixed(2);

    const card = document.createElement("div");
    card.className = "related-card";
    card.style.animationDelay = `${i * 0.08}s`;
    card.onclick = () => (window.location.href = `product.html?id=${p.id}`);

    card.innerHTML = `
      <div class="related-img-wrap">
        <img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
        <div class="related-card-rating">
          <span class="star">★</span> ${p.rating || 4.2}
        </div>
      </div>
      <div class="related-body">
        <h4>${p.title}</h4>
        <span class="r-price">₹${p.price}</span>
        <span class="r-price-old">₹${oldPrice}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ===================== ADD TO CART ===================== */

async function addToCart() {
  if (!currentUser) {
    showToast("Login required to add items", "⚠️");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  try {
    // Check existing cart item
    const res = await fetch(
      `${SHEETDB_BASE}/search?sheet=cart&userId=${currentUser.id}&productId=${productId}`
    );
    const existing = await res.json();

    if (existing.length > 0) {
      const item = existing[0];
      await fetch(`${SHEETDB_BASE}/id/${item.id}?sheet=cart`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(item.quantity) + Number(quantity),
        }),
      });
    } else {
      await fetch(`${SHEETDB_BASE}?sheet=cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Date.now().toString(),
          userId: currentUser.id,
          productId,
          title: currentProduct ? currentProduct.title : "",
          price: currentProduct ? currentProduct.price : 0,
          image: document.getElementById("mainProductImage").src,
          quantity,
          createdAt: new Date().toISOString(),
        }),
      });
    }

    showToast(`${quantity} item${quantity > 1 ? "s" : ""} added to cart`, "🛒");
    updateHeaderCartCount();
  } catch (err) {
    console.error(err);
    showToast("Failed to add to cart", "✕");
  }
}

/* ===================== BUY NOW ===================== */

async function buyNow() {
   // --- Guard ---
  if (!currentUser) {
    showToast("Login required to buy items", "⚠️");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  // --- Go to checkout ---
  try{
      sessionStorage.setItem("buyNowProductId", productId)
      sessionStorage.setItem("buyNowQty", quantity)
     window.location.href = "checkout.html";
  }catch(error){
     console.error("Failed to redirect to checkout", error)
     showToast("Failed to process request", "✕");
  }
}

/* ===================== HEADER CART COUNT ===================== */

async function updateHeaderCartCount() {
  if (!currentUser) {
    document.getElementById("cartBadge").innerText = "0";
    return;
  }

  try {
    const res = await fetch(
      `${SHEETDB_BASE}/search?sheet=cart&userId=${currentUser.id}`
    );
    const items = await res.json();
    const total = items.reduce((s, i) => s + Number(i.quantity), 0);
    document.getElementById("cartBadge").innerText = total;
  } catch {
    document.getElementById("cartBadge").innerText = "0";
  }
}

/* ===================== TOAST ===================== */

function showToast(msg, icon = "✓") {
  const wrap = document.getElementById("toastWrap");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  wrap.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 350);
  }, 2200);
}

/* ===================== PAGE LOADER ===================== */

function hideLoader() {
  const loader = document.getElementById("pageLoader");
  if (loader) loader.classList.add("done");
}