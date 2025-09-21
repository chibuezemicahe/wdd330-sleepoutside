function convertToJson(res) {
  if (res.ok) {
    return res.json();
  } else {
    throw new Error(`Bad Response: ${res.status} ${res.statusText}`);
  }
}

export default class ProductData {
  constructor(category) {
    this.category = category;
    // Path for JSON files in the public directory - Vite serves public files from root
    this.path = `/json/${this.category}.json`;
  }
  
  async getData() {
    try {
      console.log(`Fetching data from: ${this.path}`);
      const response = await fetch(this.path);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different data structures
      let products;
      if (Array.isArray(data)) {
        // Direct array format
        products = data;
      } else if (data.Result && Array.isArray(data.Result)) {
        // API response format with Result property
        products = data.Result;
      } else {
        console.error(`Unexpected data structure from ${this.path}:`, data);
        return [];
      }
      
      console.log(`Successfully loaded ${products.length} items from ${this.path}`);
      return products;
      
    } catch (error) {
      console.error(`Error fetching product data from ${this.path}:`, error);
      return [];
    }
  }
  
  async findProductById(id) {
    try {
      const products = await this.getData();
      return products.find((item) => item.Id === id);
    } catch (error) {
      console.error("Error finding product by ID:", error);
      return null;
    }
  }
}
