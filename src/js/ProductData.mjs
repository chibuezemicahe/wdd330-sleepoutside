function convertToJson(res) {
  if (res.ok) {
    return res.json();
  } else {
    throw new Error("Bad Response");
  }
}

export default class ProductData {
  constructor(category) {
    this.category = category;
    // Path for JSON files in the public directory - Vite serves public files from root
    this.path = `/json/${this.category}.json`;
  }
  getData() {
    return fetch(this.path)
      .then(convertToJson)
      .then((data) => data)
      .catch(err => {
        console.error("Error fetching product data:", err);
        return [];
      });
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
