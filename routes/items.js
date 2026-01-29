const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

let itemsCollection;

const VALID_API_KEY = "practice-api-key-12345";

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key in headers" });
  }

  if (apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
}

function parseObjectIdOr400(id, res) {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  return new ObjectId(id);
}

function setItemsCollection(collection) {
  itemsCollection = collection;
}

// GET /api/items - retrieve all items
router.get("/", async (req, res) => {
  if (!itemsCollection) {
    return res.status(503).json({ error: "Database not ready" });
  }

  try {
    const items = await itemsCollection.find({}).toArray();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/items/:id - retrieve item by ID
router.get("/:id", async (req, res) => {
  if (!itemsCollection) {
    return res.status(503).json({ error: "Database not ready" });
  }

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  try {
    const item = await itemsCollection.findOne({ _id: oid });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/items - create a new item
router.post("/", authenticateApiKey, async (req, res) => {
  if (!itemsCollection) {
    return res.status(503).json({ error: "Database not ready" });
  }

  const { name, description } = req.body ?? {};

  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: "Missing required field: name" });
  }

  try {
    const result = await itemsCollection.insertOne({
      name,
      description: description || ""
    });

    res.status(201).json({
      message: "Item created",
      id: String(result.insertedId)
    });
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/items/:id - full update (replace item)
router.put("/:id", authenticateApiKey, async (req, res) => {
  if (!itemsCollection) {
    return res.status(503).json({ error: "Database not ready" });
  }

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  const { name, description } = req.body ?? {};

  // For PUT (full update), both fields are required
  if (!name || description === undefined) {
    return res.status(400).json({ error: "Missing required fields for full update: name, description" });
  }

  try {
    const result = await itemsCollection.updateOne(
      { _id: oid },
      { $set: { name, description } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item updated" });
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/items/:id - partial update
router.patch("/:id", authenticateApiKey, async (req, res) => {
  if (!itemsCollection) {
    return res.status(503).json({ error: "Database not ready" });
  }

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  const { name, description } = req.body ?? {};
  const update = {};

  // For PATCH (partial update), at least one field is required
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update: name, description" });
  }

  try {
    const result = await itemsCollection.updateOne(
      { _id: oid },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item updated" });
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/items/:id - delete an item
router.delete("/:id", authenticateApiKey, async (req, res) => {
  if (!itemsCollection) {
    return res.status(503).json({ error: "Database not ready" });
  }

  const oid = parseObjectIdOr400(req.params.id, res);
  if (!oid) return;

  try {
    const result = await itemsCollection.deleteOne({ _id: oid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = { router, setItemsCollection };
