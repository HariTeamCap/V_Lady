# V Lady Backend

This folder contains an Express backend for the V Lady static frontend.

## Requirements
- Node.js 16+ (recommended)
- MongoDB (local or Atlas)

## Setup
1. Install dependencies

```bash
cd Backend
npm install
```

2. Create a `.env` file in `Backend/` with the following variables:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/vlady
SESSION_SECRET=your-secret
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-email-password
ADMIN_EMAIL=admin@example.com
```

3. Start the server

```bash
npm start
```

Server will serve the frontend files from the sibling `Frontend/` folder and run API endpoints under `/api/*`.

## Notes
- In production, use HTTPS and set `cookie.secure = true` in session configuration.
- The backend seeds initial products automatically if the products collection is empty.
