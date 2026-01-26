const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

let productsCollection;

function getCollectionOrFail(res) {
  if (!productsCollection) {
    res.status(503).json({ error: "Database not ready" });
    return null;
  }
  return productsCollection;
}

function parseObjectIdOr400(id, res) {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  return new ObjectId(id);
}

function setProductsCollection(collection) {
  productsCollection = collection;
}

// GET /api/products - retrieve all products
router.get("/", async (req, res) => {
  const col = getCollectionOrFail(res);
  if (!col) return;

  try {
    const { category, minPrice, sort, fields } = req.query;

    const filter = {};
    if (category) filter.category = category;

    if (minPrice !== undefined) {
      const minPriceValue = Number(minPrice);
      if (!Number.isNaN(minPriceValue)) {
        filter.price = { $gte: minPriceValue };
      }
    }

    let projection = undefined;
    if (fields) {
      projection = {};
      const fieldList = String(fields)
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      for (const f of fieldList) projection[f] = 1;
      projection._id = 1;
    }

    let query = col.find(filter);
    if (projection) query = query.project(projection);
    if (sort === "price") query = query.sort({ price: 1 });

    const products = await query.toArray();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/:id - retrieve product by ID
router.get("/:id", async (req, res) => {
  const col = getCollectionOrFail(res);
  if (!col) return;

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  try {
    const product = await col.findOne({ _id: oid });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/products - create a new product
router.post("/", async (req, res) => {
  const col = getCollectionOrFail(res);
  if (!col) return;

  const { name, price, category } = req.body ?? {};

  if (!name || category === undefined || price === undefined) {
    return res.status(400).json({ error: "Missing required fields: name, price, category" });
  }

  const priceNumber = Number(price);
  if (Number.isNaN(priceNumber)) {
    return res.status(400).json({ error: "Price must be a number" });
  }

  try {
    const result = await col.insertOne({
      name,
      price: priceNumber,
      category
    });

    res.status(201).json({
      message: "Product created",
      id: String(result.insertedId)
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/products/:id - update a product (full update)
router.put("/:id", async (req, res) => {
  const col = getCollectionOrFail(res);
  if (!col) return;

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  const { name, price, category } = req.body ?? {};
  const update = {};

  if (name !== undefined) update.name = name;
  if (category !== undefined) update.category = category;
  if (price !== undefined) {
    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber)) return res.status(400).json({ error: "Price must be a number" });
    update.price = priceNumber;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update: name, price, category" });
  }

  try {
    const result = await col.updateOne({ _id: oid }, { $set: update });
    if (result.matchedCount === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/products/:id - delete a product
router.delete("/:id", async (req, res) => {
  const col = getCollectionOrFail(res);
  if (!col) return;

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  try {
    const result = await col.deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = { router, setProductsCollection };
