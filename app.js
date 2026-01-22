require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI;

const DB_NAME = "shop";
const COLLECTION_NAME = "products";

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  return next(err);
});

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

let productsCollection;

async function start() {
  if (!MONGO_URI) {
    console.error("Missing required env var: MONGO_URI");
    process.exit(1);
  }

  const mongoOptions = {
    tls: true,
    retryWrites: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  };

  const client = new MongoClient(MONGO_URI, mongoOptions);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    productsCollection = db.collection(COLLECTION_NAME);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

  app.get("/", (req, res) => {
    res.json({
      ok: true,
      service: "practice11-api",
      endpoints: {
        version: "GET /version",
        products: {
          list: "GET /api/products",
          getById: "GET /api/products/:id",
          create: "POST /api/products",
          update: "PUT /api/products/:id",
          delete: "DELETE /api/products/:id"
        }
      }
    });
  });

  // app.get("/version", (req, res) => {
  //   res.json ({
  //     version: "1.1",
  //     updatedAt: "2026-01-18"
  //   });
  // });

  app.get("/api/products", async (req, res) => {
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

  app.get("/api/products/:id", async (req, res) => {
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

  app.post("/api/products", async (req, res) => {
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

  app.put("/api/products/:id", async (req, res) => {
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

  app.delete("/api/products/:id", async (req, res) => {
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

  app.use((req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

