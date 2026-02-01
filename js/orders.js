const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";

let currentUser = null;
let allOrders = [];
let currentFilter = 'all';

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupFilters();
  loadOrders();
  updateCartCount();
});

/* ======================
   NAVIGATION SETUP
====================== */
function setupNavigation() {
  // Logo click
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Home button
  const homeBtn = document.querySelector(".home-btn");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
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
   SETUP FILTERS
====================== */
function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Update active state
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Apply filter
      currentFilter = btn.dataset.filter;
      filterOrders(currentFilter);
    });
  });
}

/* ======================
   LOAD ORDERS
====================== */
async function loadOrders() {
  const user = sessionStorage.getItem("currentUser");
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  currentUser = JSON.parse(user);
  showLoading(true);

  try {
    const res = await fetch(`${SHEETDB_BASE}/search?sheet=orders&userId=${currentUser.id}`);
    
    if (!res.ok) {
      throw new Error("Failed to fetch orders");
    }

    allOrders = await res.json();

    if (!allOrders || !Array.isArray(allOrders)) {
      allOrders = [];
    }

    // Sort orders by date (newest first)
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Update stats
    updateStats();

    // Display orders
    displayOrders(allOrders);

  } catch (err) {
    console.error("Error loading orders:", err);
    showError("Failed to load orders. Please try again.");
  } finally {
    showLoading(false);
  }
}

/* ======================
   UPDATE STATS
====================== */
function updateStats() {
  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter(o => o.status === "PAID").length;

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("completedOrders").textContent = completedOrders;

  // Animate numbers
  animateValue("totalOrders", 0, totalOrders, 1000);
  animateValue("completedOrders", 0, completedOrders, 1000);
}

/* ======================
   DISPLAY ORDERS
====================== */
function displayOrders(orders) {
  const container = document.getElementById("ordersList");
  const emptyState = document.getElementById("emptyState");

  container.innerHTML = "";

  if (!orders || orders.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  container.style.display = "flex";
  emptyState.style.display = "none";

  orders.forEach((order, index) => {
    const items = JSON.parse(order.items || "[]");
    const orderDate = new Date(order.createdAt);
    
    const div = document.createElement("div");
    div.className = "order-card";
    div.style.animationDelay = `${index * 0.1}s`;
    div.dataset.status = order.status;

    div.innerHTML = `
      <div class="order-header">
        <div class="order-info">
          <div class="order-id">Order #${order.orderId}</div>
          <div class="order-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            ${formatDate(orderDate)}
          </div>
        </div>
        <div class="order-meta">
          <div class="order-status ${order.status === 'PAID' ? 'paid' : 'pending'}">
            ${order.status === 'PAID' ? `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              Completed
            ` : `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Pending Payment
            `}
          </div>
          <div class="order-total">₹${Number(order.total).toFixed(2)}</div>
        </div>
      </div>

      <div class="order-body">
        <div class="order-details">
          <div class="detail-item">
            <div class="detail-label">Payment Method</div>
            <div class="detail-value">${formatPaymentMethod(order.paymentMethod)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Items</div>
            <div class="detail-value">${items.length} item${items.length > 1 ? 's' : ''}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Delivery Address</div>
            <div class="detail-value">${escapeHtml(order.address || 'N/A')}</div>
          </div>
        </div>

        <div class="order-actions">
          <button class="btn-view" onclick="viewOrderDetails('${order.orderId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View Details
          </button>
          ${order.status === 'PAID' ? `
            <button class="btn-track">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 3h5v5M4 20L21 3"/>
              </svg>
              Track Order
            </button>
          ` : `
            <button class="btn-cancel" onclick="cancelOrder('${order.orderId}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
              Cancel
            </button>
          `}
        </div>
      </div>
    `;

    container.appendChild(div);
  });
}

/* ======================
   FILTER ORDERS
====================== */
function filterOrders(filter) {
  let filteredOrders = allOrders;

  if (filter !== 'all') {
    filteredOrders = allOrders.filter(order => order.status === filter);
  }

  displayOrders(filteredOrders);
}

/* ======================
   VIEW ORDER DETAILS
====================== */
function viewOrderDetails(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const items = JSON.parse(order.items || "[]");
  const modal = document.getElementById("orderDetailsModal");
  const content = document.getElementById("orderDetailsContent");

  if (!modal || !content) return;

  content.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">
            Order #${order.orderId}
          </h3>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            Placed on ${formatDate(new Date(order.createdAt))}
          </p>
        </div>
        <div class="order-status ${order.status === 'PAID' ? 'paid' : 'pending'}">
          ${order.status === 'PAID' ? 'Completed' : 'Pending Payment'}
        </div>
      </div>

      <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem;">
        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">
          Delivery Information
        </h4>
        <div style="display: grid; gap: 1rem;">
          <div>
            <span style="color: var(--text-muted); font-size: 0.875rem;">Name:</span>
            <span style="font-weight: 600; margin-left: 0.5rem;">${escapeHtml(order.fullName)}</span>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.875rem;">Email:</span>
            <span style="font-weight: 600; margin-left: 0.5rem;">${escapeHtml(order.email)}</span>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.875rem;">Phone:</span>
            <span style="font-weight: 600; margin-left: 0.5rem;">${escapeHtml(order.phone)}</span>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.875rem;">Address:</span>
            <span style="font-weight: 600; margin-left: 0.5rem;">${escapeHtml(order.address)}</span>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.875rem;">Payment:</span>
            <span style="font-weight: 600; margin-left: 0.5rem;">${formatPaymentMethod(order.paymentMethod)}</span>
          </div>
        </div>
      </div>

      <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">
        Order Items (${items.length})
      </h4>
      <div class="items-grid">
        ${items.map(item => `
          <div class="item-card">
            <div class="item-image">
              <img src="${item.image}" alt="${escapeHtml(item.title)}" />
            </div>
            <div class="item-details">
              <div class="item-title">${escapeHtml(item.title)}</div>
              <div class="item-meta">Quantity: ${item.quantity}</div>
            </div>
            <div class="item-price">₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="color: var(--text-secondary);">Subtotal</span>
          <span style="font-weight: 600;">₹${order.subtotal || calculateSubtotal(items)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="color: var(--text-secondary);">Shipping</span>
          <span style="font-weight: 600; color: var(--success-color);">FREE</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
          <span style="color: var(--text-secondary);">Tax (18%)</span>
          <span style="font-weight: 600;">₹${order.tax || calculateTax(items)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <span style="font-size: 1.25rem; font-weight: 700;">Total</span>
          <span style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">₹${Number(order.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

/* ======================
   CLOSE ORDER MODAL
====================== */
function closeOrderModal() {
  const modal = document.getElementById("orderDetailsModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  const modal = document.getElementById("orderDetailsModal");
  if (e.target === modal) {
    closeOrderModal();
  }
});

/* ======================
   CANCEL ORDER
====================== */
async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  showLoading(true);

  try {
    const res = await fetch(`${SHEETDB_BASE}/orderId/${orderId}?sheet=orders`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Failed to cancel order");
    }

    // Reload orders
    await loadOrders();
    showSuccess("Order cancelled successfully");

  } catch (err) {
    console.error("Error cancelling order:", err);
    showError("Failed to cancel order. Please try again.");
  } finally {
    showLoading(false);
  }
}

/* ======================
   UPDATE CART COUNT
====================== */
async function updateCartCount() {
  if (!currentUser) return;

  try {
    const res = await fetch(`${SHEETDB_BASE}/search?sheet=cart&userId=${currentUser.id}`);
    const cartItems = await res.json();
    
    const totalQty = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);
    
    const cartCountEl = document.querySelector(".cart-count");
    if (cartCountEl) {
      cartCountEl.textContent = totalQty;
    }
  } catch (err) {
    console.error("Error updating cart count:", err);
  }
}

/* ======================
   UTILITY FUNCTIONS
====================== */
function formatDate(date) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

function formatPaymentMethod(method) {
  const methods = {
    'upi': 'UPI Payment',
    'wallet': 'Digital Wallet'
  };
  return methods[method] || method;
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0).toFixed(2);
}

function calculateTax(items) {
  const subtotal = parseFloat(calculateSubtotal(items));
  return (subtotal * 0.18).toFixed(2);
}

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

function showSuccess(message) {
  alert(message);
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
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
    element.textContent = Math.round(current);
  }, 16);
}

// Make functions globally accessible
window.viewOrderDetails = viewOrderDetails;
window.closeOrderModal = closeOrderModal;
window.cancelOrder = cancelOrder;