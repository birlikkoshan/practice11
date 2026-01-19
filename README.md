# Practice Task 11 (Week 7): Deployment + Git

This is a Node.js + Express + MongoDB REST API.

## Requirements checklist (rubric)
- Uses **environment variables**: `PORT`, `MONGO_URI`
- **No hardcoded secrets** in code
- **MongoDB mandatory** (uses `mongodb` driver)
- All responses are **JSON**
- Required endpoints exist:
  - `GET /`
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id`

## Local setup
1. Install:
   - `npm install`
2. Create a `.env` file (DO NOT commit it):
   - `PORT=3000`
   - `MONGO_URI=...`

Template file: `env.example`

3. Run:
   - `npm start`

## Deployment notes
- Make sure the host sets:
  - `MONGO_URI`
  - `PORT` (most platforms set this automatically)
- Start command is `npm start`

