require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");
const { router: productsRouter, setProductsCollection } = require("./routes/products");
const { router: itemsRouter, setItemsCollection } = require("./routes/items");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI;

const DB_NAME = "shop";
const COLLECTION_NAME = "products";
const ITEMS_COLLECTION_NAME = "items";

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
    const productsCollection = db.collection(COLLECTION_NAME);
    const itemsCollection = db.collection(ITEMS_COLLECTION_NAME);
    
    // Pass collections to routers
    setProductsCollection(productsCollection);
    setItemsCollection(itemsCollection);
    
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
        },
        items: {
          list: "GET /api/items",
          getById: "GET /api/items/:id",
          create: "POST /api/items",
          fullUpdate: "PUT /api/items/:id",
          partialUpdate: "PATCH /api/items/:id",
          delete: "DELETE /api/items/:id"
        }
      }
    });
  });

  app.get("/version", (req, res) => {
    res.json({
      version: "1.1",
      updatedAt: "2026-01-18"
    });
  });

  // Mount routers
  app.use("/api/products", productsRouter);
  app.use("/api/items", itemsRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

start();

