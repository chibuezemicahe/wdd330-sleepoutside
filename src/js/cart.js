import { getLocalStorage, setLocalStorage } from "./utils.mjs";

function renderCartContents() {
  const cartItems = getLocalStorage("so-cart");
  if (cartItems && cartItems.length > 0) {
    const htmlItems = cartItems.map((item, index) => cartItemTemplate(item, index));
    document.querySelector(".product-list").innerHTML = htmlItems.join("");
    // Add event listeners to all remove buttons
    document.querySelectorAll(".cart-card__remove").forEach(button => {
      button.addEventListener("click", removeFromCart);
    });
  } else {
    document.querySelector(".product-list").innerHTML = "<p>Your cart is empty</p>";
  }
}

function cartItemTemplate(item, index) {
  // Fix the image path - remove the ../ prefix and add proper path
  const imageSrc = item.Image.replace('../', './');
  
  const newItem = `<li class="cart-card divider">
  <a href="#" class="cart-card__image">
    <img
      src="${imageSrc}"
      alt="${item.Name}"
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

renderCartContents();
