import { getLocalStorage, setLocalStorage } from "./utils.mjs";

function renderCartContents() {
  const cartItems = getLocalStorage("so-cart");
  const productListElement = document.querySelector(".product-list");
  const cartSummaryElement = document.getElementById("cart-summary");
  
  if (cartItems && cartItems.length > 0) {
    const htmlItems = cartItems.map((item, index) => cartItemTemplate(item, index));
    productListElement.innerHTML = htmlItems.join("");
    
    // Add event listeners to all remove buttons
    document.querySelectorAll(".cart-card__remove").forEach(button => {
      button.addEventListener("click", removeFromCart);
    });
    
    // Show cart summary and update totals
    updateCartSummary(cartItems);
    cartSummaryElement.style.display = "block";
    
  } else {
    productListElement.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty</p>
        <a href="../index.html" class="continue-shopping-link">Continue Shopping</a>
      </div>
    `;
    cartSummaryElement.style.display = "none";
  }
}

function cartItemTemplate(item, index) {
  // Fix the image path - convert ../images/... to /images/... for absolute path from root
  let imageSrc = item.Image;
  if (imageSrc && imageSrc.startsWith('../')) {
    imageSrc = imageSrc.replace('../', '/');
  }
  
  const newItem = `<li class="cart-card divider">
  <a href="#" class="cart-card__image">
    <img
      src="${imageSrc}"
      alt="${item.Name}"
      onerror="console.error('Failed to load image:', this.src)"
    />
  </a>
  <a href="#">
    <h2 class="card__name">${item.Name}</h2>
  </a>
  <p class="cart-card__color">${item.Colors[0].ColorName}</p>
  <p class="cart-card__quantity">qty: 1</p>
  <p class="cart-card__price">$${item.FinalPrice}</p>
  <button class="cart-card__remove" data-index="${index}">❌ Remove</button>
</li>`;

  return newItem;
}

function updateCartSummary(cartItems) {
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.FinalPrice), 0);
  const itemCount = cartItems.length;
  
  document.getElementById("cart-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("cart-item-count").textContent = itemCount;
}

function removeFromCart(e) {
  const index = parseInt(e.target.dataset.index);
  // Get current cart
  let cart = getLocalStorage("so-cart");
  // Remove the item at the specified index
  if (cart && index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    // Save updated cart back to localStorage
    setLocalStorage("so-cart", cart);
    // Re-render the cart contents
    renderCartContents();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Continue Shopping button
  const continueShoppingBtn = document.getElementById("continue-shopping");
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }
  
  // Proceed to Checkout button
  const checkoutBtn = document.getElementById("proceed-checkout");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cartItems = getLocalStorage("so-cart");
      if (cartItems && cartItems.length > 0) {
        window.location.href = "../checkout/";
      } else {
        alert("Your cart is empty. Add some items before checking out.");
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  renderCartContents();
  setupEventListeners();
});

// Also run immediately for compatibility
renderCartContents();
setupEventListeners();
