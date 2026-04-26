# NEERVA Deployment Guide (Step-by-Step)

This guide will walk you through deploying the entire NEERVA project. Since the project consists of three interconnected parts (ML, Backend, and Frontend), the **order of deployment is critical**.

We recommend using **[Render.com](https://render.com)** as it can host all three service types (Python, Node.js, and Static React) for free or low cost.

---

## 🚀 Deployment Overview
1.  **ML Microservice** (FastAPI/Python) → Provides intelligence.
2.  **Backend API** (Node.js/Express) → Manages data and calls ML.
3.  **Frontend Web App** (Vite/React) → The user interface.

---

## Step 1: Deploy the ML Microservice
The ML service must be deployed first so the backend has a URL to connect to.

1.  **Create a New Web Service** on Render.
2.  **Connect your GitHub Repository**.
3.  **Configure Settings**:
    *   **Name**: `neerva-ml`
    *   **Root Directory**: `ML`
    *   **Environment**: `Python`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
4.  **Environment Variables (IMPORTANT)**:
    *   `PYTHON_VERSION`: `3.10.12` (Render's default 3.14 is too new for scikit-learn)
    *   `PORT`: `8000` (Render usually sets this automatically)
5.  **Wait for deployment**: Once finished, copy your service URL (e.g., `https://neerva-ml.onrender.com`).

---

## Step 2: Deploy the Backend API
The backend handles the database and orchestrates the AI logic.

1.  **Create a New Web Service** on Render.
2.  **Root Directory**: `Backend`
3.  **Environment**: `Node`
4.  **Build Command**: `npm install`
5.  **Start Command**: `npm start` (or `node server.js`)
6.  **Environment Variables (CRITICAL)**:
    *   `MONGODB_URI`: Your MongoDB Atlas connection string.
    *   `GEMINI_API_KEY`: Your Google AI API key.
    *   `ML_SERVICE_URL`: Paste the URL from **Step 1** (e.g., `https://neerva-ml.onrender.com`).
    *   `JWT_SECRET`: A random long string for security.
7.  **Wait for deployment**: Once finished, copy your Backend URL (e.g., `https://neerva-backend.onrender.com`).

---

## Step 3: Deploy the Frontend
The frontend needs to know where the backend is to make API calls.

1.  **Create a New Static Site** on Render.
2.  **Root Directory**: `Frontend`
3.  **Build Command**: `npm run build`
4.  **Publish Directory**: `dist`
5.  **Environment Variables**:
    *   `VITE_API_URL`: Paste the URL from **Step 2** (e.g., `https://neerva-backend.onrender.com`).
6.  **Deploy**: Once finished, you will have your final public website link!

---

## ❓ What to do after "One Folder" (Backend) is deployed?
If you have just deployed the **Backend folder**, follow these steps:

1.  **Copy the Backend URL**: It will look like `https://your-app-backend.onrender.com`.
2.  **Update Frontend Settings**:
    *   Go to your local `Frontend/.env` file.
    *   Update `VITE_API_URL=https://your-app-backend.onrender.com`.
3.  **Allow Cross-Origin (CORS)**:
    *   Go back to your **Backend** environment variables on Render.
    *   Set `FRONTEND_ORIGIN` to your Frontend URL (once the frontend is deployed).
    *   This ensures the Backend allows requests from your specific website and not just "localhost".

---

## 💡 Troubleshooting
*   **ML Models missing?** The ML service is configured to auto-train on startup if `.pkl` files are missing. The first deployment might take an extra 2-3 minutes.
*   **White Screen on Frontend?** Check the Browser Console (F12). It usually means `VITE_API_URL` is missing or incorrect.
*   **Socket.io errors?** Ensure the `FRONTEND_ORIGIN` in Backend settings matches your final website URL exactly.
