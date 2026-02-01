const SHEET_API = "https://sheetdb.io/api/v1/hduolewdeznr7";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
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
  loadCart();

  // Setup checkout button
  document.getElementById("checkoutBtn").addEventListener("click", checkout);
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

  // Continue shopping button
  const continueBtn = document.querySelector(".continue-btn");
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
}

/* ======================
   LOAD CART
====================== */
async function loadCart() {
  showLoading(true);
  
  try {
    const res = await fetch(
      `${SHEET_API}/search?sheet=cart&userId=${currentUser.id}`
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const cartItems = await res.json();

    const container = document.getElementById("cartItems");
    container.innerHTML = "";

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      displayEmptyCart(container);
      updateCartSummary([], 0);
      updateHeaderCartCount(0);
      showLoading(false);
      return;
    }

    let subtotal = 0;

    cartItems.forEach((item, index) => {
      const itemTotal = Number(item.price) * Number(item.quantity);
      subtotal += itemTotal;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.style.animationDelay = `${index * 0.1}s`;
      
      div.innerHTML = `
        <div class="item-image">
          <img src="${item.image}" alt="${escapeHtml(item.title)}" />
        </div>
        
        <div class="item-details">
          <h3>${escapeHtml(item.title)}</h3>
          <p class="item-price">₹ ${Number(item.price).toFixed(2)}</p>
          <div class="item-meta">
            <span>Qty: ${item.quantity}</span>
            <span>•</span>
            <span>Total: ₹${itemTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="item-actions">
          <div class="qty-controls">
            <button onclick="updateQuantity('${item.id}', ${Number(item.quantity) - 1})" aria-label="Decrease quantity">-</button>
            <input 
              type="number" 
              value="${item.quantity}"
              min="1"
              max="99"
              onchange="setQuantity('${item.id}', this.value)"
              aria-label="Quantity" 
            />
            <button onclick="updateQuantity('${item.id}', ${Number(item.quantity) + 1})" aria-label="Increase quantity">+</button>
          </div>
          
          <button class="remove-btn" onclick="removeItem('${item.id}')" aria-label="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Remove
          </button>
        </div>
      `;
      
      container.appendChild(div);
    });

    updateCartSummary(cartItems, subtotal);
    updateHeaderCartCount(cartItems.reduce((sum, item) => sum + Number(item.quantity), 0));

  } catch (err) {
    console.error("Error loading cart:", err);
    showError("Failed to load cart. Please refresh the page.");
  } finally {
    showLoading(false);
  }
}

/* ======================
   UPDATE CART SUMMARY
====================== */
function updateCartSummary(cartItems, subtotal) {
  const itemCount = cartItems.length;
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  // Update item count
  document.getElementById("itemCount").textContent = itemCount;

  // Update subtotal in stats
  document.getElementById("subtotalPrice").textContent = subtotal.toFixed(2);

  // Update order summary
  document.getElementById("summarySubtotal").textContent = subtotal.toFixed(2);
  document.getElementById("taxAmount").textContent = tax.toFixed(2);
  document.getElementById("totalPrice").textContent = total.toFixed(2);

  // Animate the numbers
  animateValue("totalPrice", 0, total, 800);
}

/* ======================
   DISPLAY EMPTY CART
====================== */
function displayEmptyCart(container) {
  container.innerHTML = `
    <div class="empty-cart">
      <svg class="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
      <h2>Your cart is empty</h2>
      <p>Looks like you haven't added anything to your cart yet.</p>
      <button class="checkout-btn" onclick="window.location.href='index.html'" style="max-width: 300px; margin: 0 auto;">
        <span>Start Shopping</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  `;
}

/* ======================
   UPDATE QUANTITY
====================== */
async function updateQuantity(cartId, qty) {
  if (!cartId) return;
  if (qty < 1) {
    // If quantity would be less than 1, remove the item instead
    removeItem(cartId);
    return;
  }
  if (qty > 99) {
    showError("Maximum quantity is 99");
    return;
  }

  showLoading(true);

  try {
    const res = await fetch(`${SHEET_API}/id/${cartId}?sheet=cart`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    await loadCart();
    showSuccess("Quantity updated");
  } catch (err) {
    console.error("Error updating quantity:", err);
    showError("Failed to update quantity. Please try again.");
    showLoading(false);
  }
}

function setQuantity(cartId, value) {
  let qty = parseInt(value);
  if (isNaN(qty) || qty < 1) {
    qty = 1;
  }
  if (qty > 99) {
    qty = 99;
  }
  updateQuantity(cartId, qty);
}

/* ======================
   REMOVE ITEM
====================== */
async function removeItem(cartId) {
  if (!cartId) return;
  
  // Confirm removal
  if (!confirm("Are you sure you want to remove this item from your cart?")) {
    return;
  }

  showLoading(true);
  
  try {
    const res = await fetch(`${SHEET_API}/id/${cartId}?sheet=cart`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    await loadCart();
    showSuccess("Item removed from cart");
  } catch (err) {
    console.error("Error removing item:", err);
    showError("Failed to remove item. Please try again.");
    showLoading(false);
  }
}

/* ======================
   CHECKOUT
====================== */
function checkout() {
  window.location.href = "checkout.html";
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

function showSuccess(message) {
  // Simple success notification (you can enhance this with a toast library)
  console.log("Success:", message);
  // You could add a toast notification here
}

function showError(message) {
  // Simple error notification
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

// Make functions globally accessible for inline onclick handlers
window.updateQuantity = updateQuantity;
window.setQuantity = setQuantity;
window.removeItem = removeItem;