import { setLocalStorage, getLocalStorage } from "./utils.mjs";
import ProductData from "./ProductData.mjs";

const dataSource = new ProductData("tents");

// Get the product id from the URL or from the button's data-id attribute
function getProductId() {
  // First try to get from URL parameters
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let productId = urlParams.get('product');
  
  // If not in URL, try to get from the button's data-id
  if (!productId) {
    const addToCartButton = document.getElementById("addToCart");
    if (addToCartButton && addToCartButton.dataset.id) {
      productId = addToCartButton.dataset.id;
    }
  }
  
  return productId;
}

// Render the product details in the HTML (only if elements exist)
async function renderProductDetails() {
  const productId = getProductId();
  if (!productId) {
    console.log("No product ID found, skipping product details rendering");
    return;
  }
  
  try {
    const product = await dataSource.findProductById(productId);
    if (product) {
      // Only update elements that exist
      const nameElement = document.querySelector('.product-card__name');
      if (nameElement) nameElement.textContent = product.Name;
      
      const brandElement = document.querySelector('.product-card__brand');
      if (brandElement) brandElement.textContent = product.Brand.Name;
      
      const priceElement = document.querySelector('.product-card__price');
      if (priceElement) priceElement.textContent = `$${product.FinalPrice}`;
      
      const descriptionElement = document.querySelector('.product-card__description');
      if (descriptionElement) descriptionElement.innerHTML = product.DescriptionHtmlSimple;
      
      const addToCartButton = document.querySelector('#addToCart');
      if (addToCartButton) addToCartButton.dataset.id = product.Id;
      
      const imageElement = document.querySelector('.product-image img');
      if (imageElement) {
        imageElement.src = product.Images.PrimaryLarge;
        imageElement.alt = product.Name;
      }
      
      console.log("Product details rendered for:", product.Name);
    } else {
      console.log("Product not found for ID:", productId);
    }
  } catch (error) {
    console.error('Error loading product details:', error);
  }
}

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
    const productId = e.target.dataset.id || getProductId();
    console.log("Adding product to cart with ID:", productId);
    
    if (!productId) {
      throw new Error("No product ID found");
    }
    
    const product = await dataSource.findProductById(productId);
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
  console.log("DOM loaded, setting up Add to Cart functionality");
  
  // First try to render the product details (for dynamic pages)
  renderProductDetails();
  
  // Then set up the event listener
  const addToCartButton = document.getElementById("addToCart");
  if (addToCartButton) {
    console.log("Add to Cart button found, adding event listener");
    addToCartButton.addEventListener("click", addToCartHandler);
  } else {
    console.error("Add to cart button not found");
  }
});
