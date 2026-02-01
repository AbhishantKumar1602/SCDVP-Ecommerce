const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";
const ORDERS_API = `${SHEETDB_BASE}?sheet=orders`;
const BASE_API = "https://dummyjson.com/products";

let currentUser = null;
let cartItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = sessionStorage.getItem("currentUser");
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  currentUser = JSON.parse(user);

  // Setup navigation
  setupNavigation();

  // Load cart
  await loadCart();

  // Setup form submission
  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);

  // Auto-fill user info if available
  prefillUserInfo();
});

/* ======================
   NAVIGATION SETUP
====================== */
function setupNavigation() {
  // Logo click
  document.querySelector(".logo").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Orders button
  const ordersBtn = document.querySelector(".orders-btn");
  if (ordersBtn) {
    ordersBtn.addEventListener("click", () => {
      window.location.href = "orders.html";
    });
  }

  // Cart button
  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      window.location.href = "cart.html";
    });
  }
}

/* ======================
   LOAD CART
====================== */
async function loadCart() {
  showLoading(true);
  
  const buyNowProductId = sessionStorage.getItem("buyNowProductId");
  const buyNowQty = sessionStorage.getItem("buyNowQty") || 1;
  
  cartItems = []
  
  try {
    const res = await fetch(`${SHEETDB_BASE}/search?sheet=cart&userId=${currentUser.id}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    let existingCartItems = await res.json();
    
     if(buyNowProductId){
        let  buyNowProduct = null
        if (existingCartItems && Array.isArray(existingCartItems)) {
           buyNowProduct = existingCartItems.find((item)=> item.productId == buyNowProductId)
        }

        if(buyNowProduct){
             cartItems = [{ ...buyNowProduct, quantity: Number(buyNowQty) }];
        } else {
            const productRes = await fetch(`${BASE_API}/${buyNowProductId}`);
            if (!productRes.ok) {
                throw new Error("Failed to load buy-now product");
            }
            const product = await productRes.json();

             cartItems = [{
                 id: `temp_${Date.now()}`,
                 productId: product.id,
                 title: product.title,
                 price: product.price,
                 image: product.thumbnail,
                 quantity: Number(buyNowQty)
             }]
        }
     }else{
        cartItems = existingCartItems
     }


    const container = document.getElementById("cartItems");
    container.innerHTML = "";

    // Calculate totalQty for header (real cart count)
    const totalQty = Array.isArray(existingCartItems) ? existingCartItems.reduce((sum, item) => sum + Number(item.quantity), 0) : 0;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p>Your cart is empty.</p>
          <a href="cart.html" style="color: var(--accent-color); text-decoration: none;">Go to cart</a>
        </div>
      `;
      updateOrderSummary([], 0);
      updateHeaderCartCount(totalQty);
      showLoading(false);
      sessionStorage.removeItem("buyNowProductId");
      sessionStorage.removeItem("buyNowQty");
      return;
    }

    let subtotal = 0;

    cartItems.forEach((item, index) => {
      const itemTotal = Number(item.price) * Number(item.quantity);
      subtotal += itemTotal;

      const div = document.createElement("div");
      div.className = "order-item";
      div.style.animationDelay = `${index * 0.1}s`;

      div.innerHTML = `
        <div class="order-item-image">
          <img src="${item.image}" alt="${escapeHtml(item.title)}" />
        </div>
        <div class="order-item-details">
          <h4>${escapeHtml(item.title)}</h4>
          <p class="order-item-meta">Qty: ${item.quantity} × ₹${Number(item.price).toFixed(2)}</p>
          <p class="order-item-price">₹${itemTotal.toFixed(2)}</p>
        </div>
      `;

      container.appendChild(div);
    });

    updateOrderSummary(cartItems, subtotal);
    
    // Update header with actual cart count (existingCartItems), not the checkout list count
    updateHeaderCartCount(totalQty);

    // Clear buy now flags on success
    sessionStorage.removeItem("buyNowProductId");
    sessionStorage.removeItem("buyNowQty");

  } catch (err) {
    console.error("Error loading cart:", err);
    showError("Failed to load cart. Please try again.");
  } finally {
    showLoading(false);
  }
}

/* ======================
   UPDATE ORDER SUMMARY
====================== */
function updateOrderSummary(cartItems, subtotal) {
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  document.getElementById("subtotalPrice").textContent = subtotal.toFixed(2);
  document.getElementById("taxAmount").textContent = tax.toFixed(2);
  document.getElementById("totalPrice").textContent = total.toFixed(2);

  // Animate the total
  animateValue("totalPrice", 0, total, 800);
}

/* ======================
   PREFILL USER INFO
====================== */
function prefillUserInfo() {
  if (currentUser) {
    // Prefill email if available
    if (currentUser.email) {
      document.getElementById("email").value = currentUser.email;
    }
    // Prefill name if available
    if (currentUser.name) {
      document.getElementById("fullName").value = currentUser.name;
    }
    // Prefill phone if available
    if (currentUser.phone) {
      document.getElementById("phone").value = currentUser.phone;
    }
  }
}

/* ======================
   PLACE ORDER
====================== */
async function placeOrder(e) {
  e.preventDefault();

  if (!cartItems || cartItems.length === 0) {
    showError("Your cart is empty!");
    return;
  }

  // Validate form
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const pincode = document.getElementById("pincode").value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  // Validate pincode
  if (!/^\d{6}$/.test(pincode)) {
    showError("Please enter a valid 6-digit PIN code");
    document.getElementById("pincode").focus();
    return;
  }

  // Validate phone
  if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
    showError("Please enter a valid phone number");
    document.getElementById("phone").focus();
    return;
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("Please enter a valid email address");
    document.getElementById("email").focus();
    return;
  }

  showLoading(true);

  try {
    const orderId = `ORD-${Date.now()}`;
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const order = {
      orderId,
      userId: currentUser.id,
      fullName,
      email,
      phone,
      address: `${address}, ${city} - ${pincode}`,
      city,
      pincode,
      paymentMethod,
      items: JSON.stringify(cartItems),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString()
    };

    // Save order to SheetDB
    const orderRes = await fetch(ORDERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (!orderRes.ok) {
      throw new Error("Failed to create order");
    }

    // Clear cart after successful order
    await clearCart();

    // Redirect to payment page
    window.location.href = `payment.html?orderId=${orderId}&total=${total.toFixed(2)}&method=${paymentMethod}`;

  } catch (err) {
    console.error("Error placing order:", err);
    showError("Failed to place order. Please try again.");
    showLoading(false);
  }
}

/* ======================
   CLEAR CART
====================== */
async function clearCart() {
  try {
    // Delete all cart items for current user
    for (const item of cartItems) {
      await fetch(`${SHEETDB_BASE}/id/${item.id}?sheet=cart`, {
        method: "DELETE"
      });
    }
  } catch (err) {
    console.error("Error clearing cart:", err);
    // Don't throw error as order is already placed
  }
}

/* ======================
   HEADER CART COUNT
====================== */
function updateHeaderCartCount(totalQty) {
  const cartCountEl = document.querySelector(".cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = totalQty;
  }
}

/* ======================
   UTILITY FUNCTIONS
====================== */
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    if (show) {
      overlay.classList.add("active");
    } else {
      overlay.classList.remove("active");
    }
  }
}

function showError(message) {
  alert(message);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function animateValue(elementId, start, end, duration) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = current.toFixed(2);
  }, 16);
}

/* ======================
   FORM VALIDATION
====================== */
// Add real-time validation
document.addEventListener("DOMContentLoaded", () => {
  // PIN code validation
  const pincodeInput = document.getElementById("pincode");
  if (pincodeInput) {
    pincodeInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  // Phone number validation
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^\d+\s-]/g, '');
    });
  }

  // Email validation styling
  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("blur", (e) => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
      if (e.target.value && !isValid) {
        e.target.style.borderColor = "var(--danger-color)";
      } else {
        e.target.style.borderColor = "";
      }
    });
  }
}); 