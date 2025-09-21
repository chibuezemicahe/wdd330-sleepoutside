import ProductData from "./ProductData.mjs";
import { setLocalStorage, getLocalStorage } from "./utils.mjs";

class SearchManager {
  constructor() {
    this.allProducts = [];
    this.filteredProducts = [];
    this.currentQuery = '';
    this.currentCategory = '';
    this.currentSort = 'relevance';
    
    // Initialize data sources
    this.dataSources = {
      tents: new ProductData("tents"),
      backpacks: new ProductData("backpacks"),
      "sleeping-bags": new ProductData("sleeping-bags")
    };
    
    this.init();
  }
  
  async init() {
    await this.loadAllProducts();
    this.setupEventListeners();
    this.handleInitialSearch();
  }
  
  async loadAllProducts() {
    try {
      const productPromises = Object.entries(this.dataSources).map(async ([category, dataSource]) => {
        try {
          console.log(`Loading products for category: ${category}`);
          const products = await dataSource.getData();
          console.log(`Loaded ${products ? products.length : 0} products for ${category}`);
          
          // Ensure products is an array
          if (!Array.isArray(products)) {
            console.error(`Products for ${category} is not an array:`, products);
            return [];
          }
          
          return products.map(product => ({
            ...product,
            category: category
          }));
        } catch (error) {
          console.error(`Error loading ${category} products:`, error);
          return [];
        }
      });
      
      const productArrays = await Promise.all(productPromises);
      this.allProducts = productArrays.flat();
      console.log(`Loaded ${this.allProducts.length} products total`);
      
      if (this.allProducts.length === 0) {
        this.showError("No products could be loaded. Please check your connection and try again.");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      this.showError("Failed to load products. Please try again later.");
    }
  }
  
  setupEventListeners() {
    // Search form submission
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = document.getElementById("search-input").value.trim();
        this.performSearch(query);
      });
    }

    // Category filter
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
      categoryFilter.addEventListener("change", (e) => {
        this.currentCategory = e.target.value;
        this.applyFilters();
      });
    }

    // Sort filter
    const sortFilter = document.getElementById("sort-filter");
    if (sortFilter) {
      sortFilter.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.applyFilters();
      });
    }
  }
  
  handleInitialSearch() {
    // Get search query from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
      document.getElementById("search-input").value = query;
      this.performSearch(query);
    } else {
      // Show all products if no search query
      this.filteredProducts = [...this.allProducts];
      this.displayResults();
    }
  }
  
  performSearch(query) {
    this.currentQuery = query.toLowerCase();
    
    if (!query.trim()) {
      this.filteredProducts = [...this.allProducts];
    } else {
      this.filteredProducts = this.allProducts.filter(product => {
        return product.Name?.toLowerCase().includes(this.currentQuery) ||
               product.NameWithoutBrand?.toLowerCase().includes(this.currentQuery) ||
               product.Brand?.Name?.toLowerCase().includes(this.currentQuery) ||
               product.DescriptionHtmlSimple?.toLowerCase().includes(this.currentQuery);
      });
    }
    
    this.applyFilters();
  }
  
  applyFilters() {
    let results = [...this.filteredProducts];
    
    // Apply category filter
    if (this.currentCategory && this.currentCategory !== 'all') {
      results = results.filter(product => product.category === this.currentCategory);
    }
    
    // Apply sorting
    switch (this.currentSort) {
      case 'price-low':
        results.sort((a, b) => (a.FinalPrice || 0) - (b.FinalPrice || 0));
        break;
      case 'price-high':
        results.sort((a, b) => (b.FinalPrice || 0) - (a.FinalPrice || 0));
        break;
      case 'name':
        results.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
        break;
      default:
        // Keep relevance order (no additional sorting)
        break;
    }
    
    this.filteredProducts = results;
    this.displayResults();
  }
  
  displayResults() {
    const resultsContainer = document.getElementById("search-results-list");
    const resultsCount = document.getElementById("search-count");
    const noResults = document.getElementById("no-results");
    
    if (!resultsContainer) {
      console.error("Search results container not found");
      return;
    }
    
    // Update results count
    if (resultsCount) {
      const count = this.filteredProducts.length;
      const query = this.currentQuery ? ` for "${this.currentQuery}"` : '';
      resultsCount.textContent = `${count} result${count !== 1 ? 's' : ''} found${query}`;
    }
    
    if (this.filteredProducts.length === 0) {
      resultsContainer.innerHTML = '';
      if (noResults) {
        noResults.style.display = 'block';
      }
      return;
    }
    
    if (noResults) {
      noResults.style.display = 'none';
    }
    
    resultsContainer.innerHTML = this.filteredProducts.map(product => 
      this.createProductCard(product)
    ).join('');
    
    this.setupProductEventListeners();
  }
  
  createProductCard(product) {
    // Fix image path
    let imageSrc = product.Image || '';
    if (imageSrc) {
      imageSrc = imageSrc.replace(/^\.\.\//, '/');
      if (!imageSrc.startsWith('/')) {
        imageSrc = '/' + imageSrc;
      }
    }
    
    return `
      <li class="search-product-card">
        <a href="/product_pages/product.html?product=${product.Id}" class="product-link">
          ${imageSrc ? 
            `<img src="${imageSrc}" alt="${product.Name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
             <div class="no-image" style="display:none;">No Image</div>` 
            : 
            `<div class="no-image">No Image Available</div>`
          }
          <div class="product-info">
            <h3 class="product-brand">${product.Brand?.Name || ''}</h3>
            <h2 class="product-name">${product.NameWithoutBrand || product.Name}</h2>
            <p class="product-price">$${product.FinalPrice || 'N/A'}</p>
          </div>
        </a>
        <button class="add-to-cart-btn" data-id="${product.Id}" data-category="${product.category}">
          Add to Cart
        </button>
      </li>
    `;
  }
  
  setupProductEventListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        const category = e.target.dataset.category;
        this.addToCart(productId, category);
      });
    });
  }
  
  async addToCart(productId, category) {
    try {
      const dataSource = this.dataSources[category];
      if (!dataSource) {
        throw new Error(`Invalid category: ${category}`);
      }
      
      const product = await dataSource.findProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Get existing cart items
      let cartItems = getLocalStorage('so-cart') || [];
      
      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(item => item.Id === productId);
      
      if (existingItemIndex > -1) {
        // Increase quantity if item exists
        cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
      } else {
        // Add new item to cart
        cartItems.push({
          ...product,
          quantity: 1
        });
      }
      
      // Save updated cart
      setLocalStorage('so-cart', cartItems);
      
      this.showMessage(`${product.NameWithoutBrand || product.Name} added to cart!`, 'success');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showMessage('Failed to add item to cart. Please try again.', 'error');
    }
  }
  
  showMessage(message, type = "info") {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.search-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `search-message search-message-${type}`;
    messageDiv.innerHTML = `
      <span>${message}</span>
      <button class="message-close">&times;</button>
    `;
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
    
    // Close button functionality
    messageDiv.querySelector('.message-close').addEventListener('click', () => {
      messageDiv.remove();
    });
  }
  
  showError(message) {
    this.showMessage(message, 'error');
  }
}

// Initialize search manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SearchManager();
});