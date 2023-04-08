const { db } = require("../firebase");

// Define the WineProduct model
class WineProduct {
  constructor(
    name,
    price,
    summary,
    description,
    imageCover,
    images,
    categories,
    startDates
  ) {
    this.name = name;
    this.price = price;
    this.summary = summary;
    this.description = description;
    this.imageCover = imageCover;
    this.images = images;
    this.categories = categories;
    this.startDates = startDates;
  }

  // Save the WineProduct instance to the database
  save() {
    const newProductRef = db.ref("wineProducts").push();
    newProductRef.set({
      name: this.name,
      price: this.price,
      summary: this.summary,
      description: this.description,
      imageCover: this.imageCover,
      images: this.images,
      categories: this.categories,
      startDates: this.startDates,
    });
  }
}

module.exports = WineProduct;
