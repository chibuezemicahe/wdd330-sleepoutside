// Handle search form submission on main page
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("search-form");
  
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = document.getElementById("search-input").value.trim();
      
      if (query) {
        // Redirect to search page with query parameter
        window.location.href = `/search/?q=${encodeURIComponent(query)}`;
      }
    });
  }
  
  // Load some featured products on home page (optional)
  loadFeaturedProducts();
});

async function loadFeaturedProducts() {
  try {
    // Load a few products from each category for the home page
    const response = await fetch('/json/tents.json');
    const tents = await response.json();
    
    // Display first 3 tents as featured products
    const featuredProducts = tents.slice(0, 3);
    displayFeaturedProducts(featuredProducts);
    
  } catch (error) {
    console.error("Error loading featured products:", error);
  }
}

function displayFeaturedProducts(products) {
  const productList = document.querySelector(".product-list");
  
  if (productList && products.length > 0) {
    productList.innerHTML = products.map(product => {
      // Fix image path - handle multiple path formats
      let imageSrc = product.Image || '';
      
      if (imageSrc) {
        // Remove ../ and ensure it starts with /
        imageSrc = imageSrc.replace(/^\.\.\//, '/');
        
        // Ensure it starts with / if it doesn't already
        if (!imageSrc.startsWith('/')) {
          imageSrc = '/' + imageSrc;
        }
      }
      
      return `
        <li class="product-card">
          <a href="/product_pages/product.html?product=${product.Id}">
            ${imageSrc ? 
              `<img src="${imageSrc}" alt="${product.Name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
               <div class="no-image" style="display:none; height:200px; background:#f8f9fa; display:flex; align-items:center; justify-content:center; color:#666; border-radius:4px;">No Image Available</div>` 
              : 
              `<div class="no-image" style="height:200px; background:#f8f9fa; display:flex; align-items:center; justify-content:center; color:#666; border-radius:4px;">No Image Available</div>`
            }
            <h3 class="card__brand">${product.Brand?.Name || ''}</h3>
            <h2 class="card__name">${product.NameWithoutBrand}</h2>
            <p class="product-card__price">$${product.FinalPrice}</p>
          </a>
        </li>
      `;
    }).join('');
  }
}