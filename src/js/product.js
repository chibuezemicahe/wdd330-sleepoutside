import { setLocalStorage, getLocalStorage } from "./utils.mjs";
import ProductData from "./ProductData.mjs";

const dataSource = new ProductData("tents");

function addProductToCart(product) {
  try {
    // Use our utility function instead of direct localStorage access
    let cart = getLocalStorage("so-cart");
    // If cart is not an array, initialize it
    if (!Array.isArray(cart)) {
      cart = [];
    }
    // Add new product to cart array
    cart.push(product);
    // Save updated cart back to localStorage
    setLocalStorage("so-cart", cart);
    console.log("Product added to cart:", product.Name);
    // Show feedback to user
    alert(`${product.Name} added to cart!`);
  } catch (error) {
    console.error("Error adding product to cart:", error);
    alert("Could not add item to cart. Please try again.");
  }
}

// add to cart button event handler
async function addToCartHandler(e) {
  try {
    const product = await dataSource.findProductById(e.target.dataset.id);
    if (product) {
      addProductToCart(product);
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error in add to cart handler:", error);
    alert("Something went wrong. Please try again.");
  }
}

// add listener to Add to Cart button when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const addToCartButton = document.getElementById("addToCart");
  if (addToCartButton) {
    addToCartButton.addEventListener("click", addToCartHandler);
  } else {
    console.error("Add to cart button not found");
  }
});
