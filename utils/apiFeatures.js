// Class to handle API query features like filtering, sorting, selecting, and pagination
class APIFeatures {
  // Constructor to accept query and query string
  constructor(query, queryString) {
    // Assign query and query string to instance properties
    this.query = query;
    this.queryString = queryString;
  }

  // Method to filter query based on query string
  filter() {
    // Create a copy of the query string
    const queryObj = { ...this.queryString };
    // Array of fields to exclude from filtering
    const excludedFields = ["page", "sort", "limit", "fields"];
    // Loop over excluded fields and delete them from query object
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering: replace operators in query string with MongoDB operators
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // Apply filtering to query
    this.query = this.query.where(JSON.parse(queryString));

    // Return instance for chaining
    return this;
  }

  // Method to sort query based on query string
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by creation date
      this.query = this.query.sort("-createdAt");
    }

    // Return instance for chaining
    return this;
  }

  // Method to limit fields of query based on query string
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // Exclude version field by default
      this.query = this.query.select("-__v");
    }

    // Return instance for chaining
    return this;
  }

  // Method to paginate query based on query string
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // Apply pagination to query
    this.query = this.query.skip(skip).limit(limit);

    // Return instance for chaining
    return this;
  }
}

// Export class
module.exports = APIFeatures;
