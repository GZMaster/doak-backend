const { getDatabase, set, ref, get } = require("firebase/database");
const { firebaseApp } = require("../firebase");

const db = getDatabase(firebaseApp);

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
    const newWineProduct = set(ref(db, "wineProducts"), {
      name: this.name,
      price: this.price,
      summary: this.summary,
      description: this.description,
      imageCover: this.imageCover,
      images: this.images,
      categories: this.categories,
      startDates: this.startDates,
    });

    return newWineProduct;
  }

  // Update the WineProduct instance in the database
  update() {
    const updatedWineProduct = set(ref(db, "wineProducts"), {
      name: this.name,
      price: this.price,
      summary: this.summary,
      description: this.description,
      imageCover: this.imageCover,
      images: this.images,
      categories: this.categories,
      startDates: this.startDates,
    });

    return updatedWineProduct;
  }

  // Delete the WineProduct instance from the database
  delete() {
    const deletedWineProduct = set(ref(db, "wineProducts"), {
      name: this.name,
      price: this.price,
      summary: this.summary,
      description: this.description,
      imageCover: this.imageCover,
      images: this.images,
      categories: this.categories,
      startDates: this.startDates,
    });

    return deletedWineProduct;
  }

  // Get all WineProduct instances from the database
  static getAll() {
    const wineProducts = get(ref(db, "wineProducts"));

    return wineProducts;
  }

  // Get a WineProduct instance from the database
  static getOne(id) {
    const wineProduct = get(ref(db, `wineProducts/${id}`));

    return wineProduct;
  }
}

module.exports = WineProduct;
