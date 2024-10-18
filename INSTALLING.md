# Project Setup Instructions

This guide will walk you through setting up the project on your local machine, both the backend and frontend, including Redis for background task processing.

## Prerequisites

Ensure you have the following software installed:

- **Python 3.7+**
- **Node.js** (for the frontend)
- **Redis** (for task queuing)
- **npm** (Node.js package manager)
- **pip** (Python package installer)
- **gunicorn** (WSGI HTTP Server for Python)

---

## Backend Setup

### 1. Clone the Repository

Start by cloning the repository:

```bash
git clone https://github.com/JasperDeasey/return_based_attribution.git
cd return_based_attribution
```

### 2. Create and Activate Virtual Environment

Create a Python virtual environment and activate it:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Backend Dependencies

Install all the required Python packages from `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 4. Install and Start Redis

If Redis is not installed on your machine, install it using Homebrew:

```bash
brew install redis
```

Start the Redis server:

```bash
redis-server
```

### 5. Start Backend Server

Start the backend using `gunicorn`:

```bash
gunicorn backend.app:app
```

Alternatively, for development, you can use Flask’s built-in server:

```bash
cd backend
python app.py
```

### 6. Start RQ Worker

In another terminal window, activate the virtual environment and start the RQ worker for background task processing:

```bash
cd backend
source venv/bin/activate
python worker.py
```

---

## Frontend Setup

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Node.js Dependencies

Install the required Node.js packages using npm:

```bash
npm install
```

### 3. Start the Frontend Development Server

Start the React frontend:

```bash
npm start
```

The frontend will be served at `http://localhost:3000`.

---

## Summary of Commands

### Backend Setup:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
gunicorn backend.app:app  # or python app.py
```

### Redis Setup:

```bash
brew install redis
redis-server
```

### Worker:

```bash
cd backend
source venv/bin/activate
python worker.py
```

### Frontend Setup:

```bash
cd frontend
npm install
npm start
```

---

## Troubleshooting

1. **Redis Connection Issues**:
   - Ensure that Redis is running with the `redis-server` command.
   
2. **Missing Dependencies**:
   - If a package is missing or there are installation issues, run:
     ```bash
     pip install <missing-package>
     ```
   
3. **Frontend Issues**:
   - Ensure `npm install` was successful. If issues persist, delete the `node_modules` folder and try reinstalling:
     ```bash
     rm -rf node_modules
     npm install
     ```

---

Now you should have both the backend and frontend running locally! If you encounter any problems, refer to the Troubleshooting section or consult the official documentation for `Flask`, `Redis`, `React`, or any other technology used in this project.