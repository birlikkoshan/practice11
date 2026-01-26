# Practice Task 11 & 13

This is a Node.js + Express + MongoDB REST API with endpoints for Products and Items.

## Requirements checklist (rubric)
- Uses **environment variables**: `PORT`, `MONGO_URI`
- **No hardcoded secrets** in code
- **MongoDB mandatory** (uses `mongodb` driver)
- All responses are **JSON**
- **Products Endpoints:**
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id`
  
- **Items Endpoints (Practice Task 13):**
  - `GET /api/items` - retrieve all items
  - `GET /api/items/:id` - retrieve item by ID
  - `POST /api/items` - create a new item
  - `PUT /api/items/:id` - full update (requires all fields)
  - `PATCH /api/items/:id` - partial update (optional fields)
  - `DELETE /api/items/:id` - delete an item

## Local setup
`.env`:
   - `PORT=3000`
   - `MONGO_URI=...`

## API Features
- ✅ Resource-based endpoints
- ✅ Correct HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Clean JSON responses with proper status codes (200, 201, 204, 400, 404, 500)
- ✅ Input validation
- ✅ Error handling with try/catch
- ✅ MongoDB database integration

