import { getLocalStorage, setLocalStorage } from "./utils.mjs";

let cartItems = [];
let orderTotal = 0;

// Initialize checkout page
function initCheckout() {
  cartItems = getLocalStorage("so-cart") || [];
  
  if (cartItems.length === 0) {
    // Redirect to cart if no items
    showMessage("Your cart is empty. Redirecting to cart page.", "error");
    setTimeout(() => {
      window.location.href = "/cart/";
    }, 2000);
    return;
  }
  
  renderOrderSummary();
  setupEventListeners();
}

// Show message to user
function showMessage(message, type = "info") {
  // Remove existing message if any
  const existingMessage = document.querySelector(".checkout-message");
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `checkout-message ${type}`;
  messageDiv.innerHTML = `
    <span class="message-text">${message}</span>
    <button class="message-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  // Insert at top of checkout container
  const checkoutContainer = document.querySelector(".checkout-container");
  checkoutContainer.insertBefore(messageDiv, checkoutContainer.firstChild);
  
  // Auto-remove after 5 seconds for non-error messages
  if (type !== "error") {
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 5000);
  }
}

// Clear all validation errors
function clearValidationErrors() {
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => {
    input.classList.remove("error");
    const errorMsg = input.parentElement.querySelector(".error-message");
    if (errorMsg) {
      errorMsg.remove();
    }
  });
}

// Show field error
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  field.classList.add("error");
  
  // Remove existing error message
  const existingError = field.parentElement.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);
}

// Validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

function validateZipCode(zip) {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

function validateCardNumber(cardNumber) {
  // Remove spaces and check if it's all digits
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (!/^\d+$/.test(cleanNumber)) return false;
  
  // Check length (13-19 digits for most cards)
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  // Luhn algorithm check
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

function validateExpiryDate(expiry) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  
  const [month, year] = expiry.split('/').map(num => parseInt(num));
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  if (month < 1 || month > 12) return false;
  if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
  
  return true;
}

function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

// Render order summary
function renderOrderSummary() {
  const orderItemsContainer = document.getElementById("order-items");
  
  if (!orderItemsContainer) return;
  
  const itemsHTML = cartItems.map(item => {
    const imageSrc = item.Image.startsWith('../') ? item.Image.replace('../', '/') : item.Image;
    return `
      <div class="order-item">
        <img src="${imageSrc}" alt="${item.Name}" class="order-item-image">
        <div class="order-item-details">
          <h4>${item.Name}</h4>
          <p class="item-color">${item.Colors[0].ColorName}</p>
          <p class="item-quantity">Qty: 1</p>
        </div>
        <div class="order-item-price">$${parseFloat(item.FinalPrice).toFixed(2)}</div>
      </div>
    `;
  }).join('');
  
  orderItemsContainer.innerHTML = itemsHTML;
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.FinalPrice), 0);
  const shipping = subtotal > 100 ? 0 : 10.00; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  orderTotal = subtotal + shipping + tax;
  
  // Update totals in UI
  document.getElementById("order-subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("order-shipping").textContent = shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
  document.getElementById("order-tax").textContent = `$${tax.toFixed(2)}`;
  document.getElementById("order-total").textContent = `$${orderTotal.toFixed(2)}`;
}

// Setup event listeners
function setupEventListeners() {
  // Back to cart button
  const backToCartBtn = document.getElementById("back-to-cart");
  if (backToCartBtn) {
    backToCartBtn.addEventListener("click", () => {
      window.location.href = "/cart/";
    });
  }
  
  // Form submission
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleOrderSubmission);
  }
  
  // Card number formatting
  const cardNumberInput = document.getElementById("cardNumber");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", formatCardNumber);
  }
  
  // Expiry date formatting
  const expiryInput = document.getElementById("expiry");
  if (expiryInput) {
    expiryInput.addEventListener("input", formatExpiryDate);
  }
  
  // CVV input restriction
  const cvvInput = document.getElementById("cvv");
  if (cvvInput) {
    cvvInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }
  
  // Continue shopping from confirmation modal
  const continueShoppingBtn = document.getElementById("continue-shopping-final");
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      // Clear cart and redirect to home
      setLocalStorage("so-cart", []);
      window.location.href = "/";
    });
  }
  
  // Real-time validation
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => {
    input.addEventListener("blur", validateField);
    input.addEventListener("input", () => {
      if (input.classList.contains("error")) {
        validateField({ target: input });
      }
    });
  });
}

// Validate individual field
function validateField(e) {
  const field = e.target;
  const fieldId = field.id;
  const value = field.value.trim();
  
  // Clear previous error
  field.classList.remove("error");
  const existingError = field.parentElement.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }
  
  // Skip validation if field is empty (required validation will catch it)
  if (!value) return;
  
  let isValid = true;
  let errorMessage = "";
  
  switch (fieldId) {
    case "fname":
    case "lname":
      if (value.length < 2) {
        isValid = false;
        errorMessage = "Name must be at least 2 characters long";
      } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
        isValid = false;
        errorMessage = "Name can only contain letters, spaces, hyphens, and apostrophes";
      }
      break;
      
    case "street":
      if (value.length < 5) {
        isValid = false;
        errorMessage = "Please enter a complete street address";
      }
      break;
      
    case "city":
      if (value.length < 2) {
        isValid = false;
        errorMessage = "City name must be at least 2 characters long";
      } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
        isValid = false;
        errorMessage = "City name can only contain letters, spaces, hyphens, and apostrophes";
      }
      break;
      
    case "state":
      if (value.length !== 2 || !/^[A-Z]{2}$/.test(value.toUpperCase())) {
        isValid = false;
        errorMessage = "Please enter a valid 2-letter state code (e.g., CA, NY)";
      }
      break;
      
    case "zip":
      if (!validateZipCode(value)) {
        isValid = false;
        errorMessage = "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)";
      }
      break;
      
    case "cardNumber":
      if (!validateCardNumber(value)) {
        isValid = false;
        errorMessage = "Please enter a valid credit card number";
      }
      break;
      
    case "expiry":
      if (!validateExpiryDate(value)) {
        isValid = false;
        errorMessage = "Please enter a valid expiry date (MM/YY) that hasn't passed";
      }
      break;
      
    case "cvv":
      if (!validateCVV(value)) {
        isValid = false;
        errorMessage = "CVV must be 3 or 4 digits";
      }
      break;
      
    case "cardName":
      if (value.length < 2) {
        isValid = false;
        errorMessage = "Name on card must be at least 2 characters long";
      } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
        isValid = false;
        errorMessage = "Name can only contain letters, spaces, hyphens, and apostrophes";
      }
      break;
  }
  
  if (!isValid) {
    showFieldError(fieldId, errorMessage);
  }
}

// Format card number with spaces
function formatCardNumber(e) {
  let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
  let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
  if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
  e.target.value = formattedValue;
}

// Format expiry date MM/YY
function formatExpiryDate(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  e.target.value = value;
}

// Handle form submission with comprehensive validation
function handleOrderSubmission(e) {
  e.preventDefault();
  
  // Clear previous messages and errors
  clearValidationErrors();
  const existingMessage = document.querySelector(".checkout-message");
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Comprehensive validation
  let isValid = true;
  const errors = [];
  
  // Required field validation
  const requiredFields = [
    { id: 'fname', name: 'First Name' },
    { id: 'lname', name: 'Last Name' },
    { id: 'street', name: 'Street Address' },
    { id: 'city', name: 'City' },
    { id: 'state', name: 'State' },
    { id: 'zip', name: 'ZIP Code' },
    { id: 'cardNumber', name: 'Card Number' },
    { id: 'expiry', name: 'Expiry Date' },
    { id: 'cvv', name: 'CVV' },
    { id: 'cardName', name: 'Name on Card' }
  ];
  
  requiredFields.forEach(field => {
    const value = formData.get(field.id);
    if (!value || value.trim() === '') {
      showFieldError(field.id, `${field.name} is required`);
      errors.push(`${field.name} is required`);
      isValid = false;
    }
  });
  
  if (!isValid) {
    showMessage("Please fill in all required fields.", "error");
    return;
  }
  
  // Detailed validation
  const fname = formData.get('fname').trim();
  const lname = formData.get('lname').trim();
  const street = formData.get('street').trim();
  const city = formData.get('city').trim();
  const state = formData.get('state').trim().toUpperCase();
  const zip = formData.get('zip').trim();
  const cardNumber = formData.get('cardNumber').trim();
  const expiry = formData.get('expiry').trim();
  const cvv = formData.get('cvv').trim();
  const cardName = formData.get('cardName').trim();
  
  // Validate each field
  if (fname.length < 2 || !/^[a-zA-Z\s'-]+$/.test(fname)) {
    showFieldError('fname', 'Please enter a valid first name');
    errors.push('Invalid first name');
    isValid = false;
  }
  
  if (lname.length < 2 || !/^[a-zA-Z\s'-]+$/.test(lname)) {
    showFieldError('lname', 'Please enter a valid last name');
    errors.push('Invalid last name');
    isValid = false;
  }
  
  if (street.length < 5) {
    showFieldError('street', 'Please enter a complete street address');
    errors.push('Invalid street address');
    isValid = false;
  }
  
  if (city.length < 2 || !/^[a-zA-Z\s'-]+$/.test(city)) {
    showFieldError('city', 'Please enter a valid city name');
    errors.push('Invalid city name');
    isValid = false;
  }
  
  if (state.length !== 2 || !/^[A-Z]{2}$/.test(state)) {
    showFieldError('state', 'Please enter a valid 2-letter state code');
    errors.push('Invalid state code');
    isValid = false;
  }
  
  if (!validateZipCode(zip)) {
    showFieldError('zip', 'Please enter a valid ZIP code');
    errors.push('Invalid ZIP code');
    isValid = false;
  }
  
  if (!validateCardNumber(cardNumber)) {
    showFieldError('cardNumber', 'Please enter a valid credit card number');
    errors.push('Invalid credit card number');
    isValid = false;
  }
  
  if (!validateExpiryDate(expiry)) {
    showFieldError('expiry', 'Please enter a valid expiry date that hasn\'t passed');
    errors.push('Invalid or expired card');
    isValid = false;
  }
  
  if (!validateCVV(cvv)) {
    showFieldError('cvv', 'CVV must be 3 or 4 digits');
    errors.push('Invalid CVV');
    isValid = false;
  }
  
  if (cardName.length < 2 || !/^[a-zA-Z\s'-]+$/.test(cardName)) {
    showFieldError('cardName', 'Please enter a valid name as it appears on the card');
    errors.push('Invalid name on card');
    isValid = false;
  }
  
  if (!isValid) {
    showMessage("Please correct the errors below and try again.", "error");
    return;
  }
  
  // Show processing state
  const submitBtn = document.getElementById("place-order");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Processing Order...";
  submitBtn.disabled = true;
  
  showMessage("Processing your order...", "info");
  
  // Simulate order processing with potential failure
  setTimeout(() => {
    // Simulate random failure for demonstration (remove in production)
    const shouldFail = Math.random() < 0.1; // 10% chance of failure
    
    if (shouldFail) {
      // Simulate processing error
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      showMessage("Sorry, there was an error processing your order. Please try again or contact customer service.", "error");
    } else {
      // Success
      processOrder(formData);
    }
  }, 2000);
}

// Process the order
function processOrder(formData) {
  try {
    // Generate order number
    const orderNumber = 'SO' + Date.now().toString().slice(-6);
    
    // Create order object
    const order = {
      orderNumber: orderNumber,
      items: cartItems,
      total: orderTotal,
      shippingInfo: {
        firstName: formData.get('fname'),
        lastName: formData.get('lname'),
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state').toUpperCase(),
        zip: formData.get('zip')
      },
      orderDate: new Date().toISOString()
    };
    
    // Save order to localStorage (in real app, this would go to a server)
    const orders = getLocalStorage("so-orders") || [];
    orders.push(order);
    setLocalStorage("so-orders", orders);
    
    // Clear cart
    setLocalStorage("so-cart", []);
    
    // Show success message
    showMessage("Order placed successfully!", "success");
    
    // Show confirmation modal
    showOrderConfirmation(order);
    
    // Reset form
    const submitBtn = document.getElementById("place-order");
    submitBtn.textContent = "Place Order";
    submitBtn.disabled = false;
    
  } catch (error) {
    console.error("Error processing order:", error);
    showMessage("An unexpected error occurred. Please try again.", "error");
    
    // Reset button
    const submitBtn = document.getElementById("place-order");
    submitBtn.textContent = "Place Order";
    submitBtn.disabled = false;
  }
}

// Show order confirmation modal
function showOrderConfirmation(order) {
  const modal = document.getElementById("order-confirmation");
  const orderNumberSpan = document.getElementById("order-number");
  const confirmationDetails = document.getElementById("confirmation-details");
  
  orderNumberSpan.textContent = order.orderNumber;
  
  const detailsHTML = `
    <div class="confirmation-summary">
      <h4>Order Details:</h4>
      <p><strong>Items:</strong> ${order.items.length}</p>
      <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
      <p><strong>Shipping to:</strong> ${order.shippingInfo.firstName} ${order.shippingInfo.lastName}</p>
      <p>${order.shippingInfo.street}</p>
      <p>${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.zip}</p>
      <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
    </div>
  `;
  
  confirmationDetails.innerHTML = detailsHTML;
  modal.style.display = "flex";
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initCheckout);