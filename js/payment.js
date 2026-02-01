const SHEETDB_BASE = "https://sheetdb.io/api/v1/hduolewdeznr7";

const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");
const total = params.get("total");
const paymentMethod = params.get("method");

let currentUser = null;
let currentOrder = null;

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  loadOrder();
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

  // Orders button
  const ordersBtn = document.querySelector(".orders-btn");
  if (ordersBtn) {
    ordersBtn.addEventListener("click", () => {
      window.location.href = "orders.html";
    });
  }
}

/* ======================
   LOAD ORDER
====================== */
async function loadOrder() {
  const user = sessionStorage.getItem("currentUser");
  if (!user) {
    alert("Login required!");
    window.location.href = "login.html";
    return;
  }
  currentUser = JSON.parse(user);

  showLoading(true);

  try {
    // If we have total from URL, use it directly
    if (total && orderId) {
      document.getElementById("totalAmount").textContent = total;
      document.getElementById("orderId").textContent = orderId;
      animateValue("totalAmount", 0, parseFloat(total), 1000);
    }

    // Fetch order details from database
    const res = await fetch(`${SHEETDB_BASE}/search?sheet=orders&orderId=${orderId}`);
    
    if (!res.ok) {
      throw new Error("Failed to fetch order");
    }

    const data = await res.json();

    if (!data || !data.length) {
      alert("Invalid order!");
      window.location.href = "orders.html";
      return;
    }

    currentOrder = data[0];

    // Update UI with order details
    document.getElementById("totalAmount").textContent = currentOrder.total;
    document.getElementById("orderId").textContent = currentOrder.orderId;
    
    // Animate the amount
    animateValue("totalAmount", 0, parseFloat(currentOrder.total), 1000);

    // Display payment method
    displayPaymentMethod(currentOrder.paymentMethod || paymentMethod);

  } catch (err) {
    console.error("Error loading order:", err);
    showError("Failed to load order details. Please try again.");
  } finally {
    showLoading(false);
  }
}

/* ======================
   DISPLAY PAYMENT METHOD
====================== */
function displayPaymentMethod(method) {
  const methodCard = document.getElementById("selectedMethod");
  const actionCard = document.getElementById("paymentActionCard");

  if (!methodCard || !actionCard) return;

  let methodHTML = '';
  let actionHTML = '';

  switch(method) {
    case 'upi':
      methodHTML = `
        <div class="method-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="method-details">
          <h4>UPI Payment</h4>
          <p>Pay using UPI apps</p>
        </div>
      `;
      actionHTML = `
        <div class="qr-code-container">
          <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Scan QR Code</h4>
          <div class="qr-placeholder">
            <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">Or pay to UPI ID:</p>
          <div class="upi-id">shopx@upi</div>
          <div class="form-group" style="margin-top: 1.5rem; text-align: left;">
            <label>Enter UPI Transaction ID (after payment)</label>
            <input type="text" placeholder="Enter transaction ID" id="upiTransactionId" />
          </div>
        </div>
      `;
      break;

    case 'wallet':
      methodHTML = `
        <div class="method-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h7"/>
            <path d="M16 17a2 2 0 100 4 2 2 0 000-4zm0 0v-4"/>
          </svg>
        </div>
        <div class="method-details">
          <h4>Digital Wallet</h4>
          <p>Paytm, PhonePe, Google Pay</p>
        </div>
      `;
      actionHTML = `
        <div style="padding: 1rem;">
          <h4 style="margin-bottom: 1.5rem; color: var(--text-primary);">Select your wallet</h4>
          <div style="display: grid; gap: 1rem;">
            <label style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); cursor: pointer; border: 2px solid var(--border-color); transition: all 0.3s ease;">
              <input type="radio" name="wallet" value="paytm" checked />
              <span style="font-weight: 600;">Paytm</span>
            </label>
            <label style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); cursor: pointer; border: 2px solid var(--border-color); transition: all 0.3s ease;">
              <input type="radio" name="wallet" value="phonepe" />
              <span style="font-weight: 600;">PhonePe</span>
            </label>
            <label style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); cursor: pointer; border: 2px solid var(--border-color); transition: all 0.3s ease;">
              <input type="radio" name="wallet" value="gpay" />
              <span style="font-weight: 600;">Google Pay</span>
            </label>
          </div>
          <div class="form-group" style="margin-top: 1.5rem;">
            <label>Wallet Mobile Number</label>
            <input type="tel" placeholder="Enter mobile number" id="walletPhone" />
          </div>
        </div>
      `;
      break;

    default:
      methodHTML = `
        <div class="method-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
        <div class="method-details">
          <h4>Payment Method</h4>
          <p>Complete your payment</p>
        </div>
      `;
  }

  methodCard.innerHTML = methodHTML;
  actionCard.innerHTML = actionHTML;
}

/* ======================
   PAY NOW
====================== */
async function payNow() {
  // Validate based on payment method
  if (!validatePayment()) {
    return;
  }

  showLoading(true);

  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update order status
    const updateRes = await fetch(`${SHEETDB_BASE}/orderId/${orderId}?sheet=orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status: "PAID",
        paidAt: new Date().toISOString()
      })
    });

    if (!updateRes.ok) {
      throw new Error("Failed to update order status");
    }

    // Show success modal
    showLoading(false);
    showSuccessModal();

  } catch (err) {
    console.error("Payment error:", err);
    showLoading(false);
    showError("Payment failed. Please try again.");
  }
}

/* ======================
   VALIDATE PAYMENT
====================== */
function validatePayment() {
  const method = currentOrder?.paymentMethod || paymentMethod;

  switch(method) {
    case 'upi':
      const upiTransactionId = document.getElementById("upiTransactionId")?.value;
      if (!upiTransactionId || upiTransactionId.trim().length < 8) {
        showError("Please enter UPI transaction ID after completing payment");
        return false;
      }
      break;

    case 'wallet':
      const walletPhone = document.getElementById("walletPhone")?.value;
      if (!walletPhone || walletPhone.replace(/\D/g, '').length < 10) {
        showError("Please enter a valid mobile number");
        return false;
      }
      break;
  }

  return true;
}

/* ======================
   SHOW SUCCESS MODAL
====================== */
function showSuccessModal() {
  const modal = document.getElementById("successModal");
  const modalOrderId = document.getElementById("modalOrderId");
  
  if (modal && modalOrderId) {
    modalOrderId.textContent = orderId;
    modal.classList.add("active");
  }
}

/* ======================
   GO TO ORDERS
====================== */
function goToOrders() {
  window.location.href = "orders.html";
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