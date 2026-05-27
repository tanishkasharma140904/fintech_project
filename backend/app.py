# ============================================================
# FILE: backend/app.py
# PURPOSE: Your Flask backend server.
#
# HOW TO RUN:
#   1. Open terminal
#   2. cd backend
#   3. Activate venv:  venv\Scripts\activate  (Windows)
#                   or source venv/bin/activate (Mac/Linux)
#   4. python app.py
#
# You'll see: Running on http://127.0.0.1:5000
# ============================================================

# ── Imports ──────────────────────────────────────────────────

# Flask      → the main framework class
# request    → lets you READ what the frontend sent (files, JSON, etc.)
# jsonify    → converts a Python dict into a proper JSON HTTP response
from flask import Flask, request, jsonify

# CORS → allows your React app (port 5173) to talk to Flask (port 5000)
from flask_cors import CORS

# os → built-in Python module for file/folder operations
import os


# ── App Setup ────────────────────────────────────────────────

# Create the Flask application instance
# __name__ tells Flask the name of the current file — always pass this
app = Flask(__name__)

# Enable CORS for ALL routes
# This adds the right HTTP headers so browsers allow cross-origin requests
# origins="*" means: accept requests from ANY address (fine for development)
CORS(app, origins="*")


# ── Configuration ────────────────────────────────────────────

# Where uploaded files will be saved on disk
# os.path.join builds a file path that works on Windows AND Mac/Linux
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")

# Attach this setting to the Flask app object
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Only allow CSV files — reject anything else
ALLOWED_EXTENSIONS = {"csv"}

# Make sure the uploads/ folder exists
# exist_ok=True means: don't crash if the folder already exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ── Helper Function ──────────────────────────────────────────

def allowed_file(filename):
    """
    Returns True if the uploaded file has a .csv extension.
    
    How it works:
      "expenses.csv"  → "csv" → True   ✅
      "photo.png"     → "png" → False  ❌
      "report"        → no dot → False ❌
    
    '.' in filename      → checks there IS a dot in the name
    filename.rsplit('.', 1)[1]  → splits at the LAST dot, takes the part after
    .lower()            → makes it lowercase so .CSV and .csv both work
    """
    return (
        "." in filename and
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# ── Routes ───────────────────────────────────────────────────
# A "route" is a URL your server listens on.
# The @app.route decorator links a URL to a Python function.
# When Flask receives a request to that URL, it calls the function.

# ── Route 1: Health Check ────────────────────────────────────
# URL: GET http://localhost:5000/
# Purpose: Quick test to confirm Flask is running.
# Open this URL in your browser — if you see the message, Flask works.
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "NovaTrade Flask backend is running 🚀"
    })


# ── Route 2: CSV Upload ──────────────────────────────────────
# URL:    POST http://localhost:5000/upload-expense
# Receives: a multipart form submission containing a CSV file
# Returns:  JSON with status and filename
#
# methods=["POST"] → this route ONLY accepts POST requests
# Sending a GET to this URL will return a 405 Method Not Allowed error
@app.route("/upload-expense", methods=["POST"])
def upload_expense():
    """
    Receives a CSV file from the React frontend.
    
    DATA FLOW:
      React sends:   FormData object with a "file" field
      Flask reads:   request.files["file"]
      Flask saves:   file to backend/uploads/
      Flask returns: JSON { status, filename, message }
    """

    # ── Step 1: Check a file was actually sent ──────────────
    # request.files is a dictionary of all files sent in the request
    # "file" is the field name we'll use in React's FormData (must match!)
    if "file" not in request.files:
        # jsonify() turns a Python dict into a JSON HTTP response
        # 400 = HTTP status code for "Bad Request" (client sent wrong data)
        return jsonify({
            "status": "error",
            "message": "No file was sent. Make sure the field name is 'file'."
        }), 400


    # ── Step 2: Get the file object ─────────────────────────
    # request.files["file"] gives us the uploaded file as a Python object
    file = request.files["file"]


    # ── Step 3: Check the file wasn't empty ─────────────────
    # If the user submits without choosing a file, filename will be ""
    if file.filename == "":
        return jsonify({
            "status": "error",
            "message": "No file selected."
        }), 400


    # ── Step 4: Validate it's actually a CSV ─────────────────
    if not allowed_file(file.filename):
        return jsonify({
            "status": "error",
            "message": f"File type not allowed. Please upload a .csv file. Got: {file.filename}"
        }), 400


    # ── Step 5: Save the file to disk ────────────────────────
    # file.filename is the original name from the user's computer
    # e.g. "my expenses nov 2024.csv"
    filename = file.filename

    # Build the full path: backend/uploads/my expenses nov 2024.csv
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    # .save() writes the file to disk at the given path
    file.save(save_path)

    # Print to your terminal so you can see what's happening
    # This is your best debugging tool as a beginner!
    print(f"\n✅ File received: {filename}")
    print(f"   Saved to: {save_path}\n")


    # ── Step 6: Return a success response ────────────────────
    # 200 = HTTP status code for "OK / Success" (this is the default)
    return jsonify({
        "status": "success",
        "message": "File uploaded successfully!",
        "filename": filename,
    })


# ── Error Handlers ───────────────────────────────────────────
# These run automatically when specific HTTP errors occur.
# Good habit to add these from the start.

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Route not found. Check your URL."
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "status": "error",
        "message": "Wrong HTTP method. Check GET vs POST."
    }), 405


# ── Start the Server ─────────────────────────────────────────
# This block only runs when you do: python app.py
# It does NOT run when another file imports app.py
if __name__ == "__main__":
    print("🚀 Starting NovaTrade Flask backend...")
    print("📁 Upload folder:", UPLOAD_FOLDER)
    print("🌐 Running at: http://localhost:5001\n")

    app.run(
        host="0.0.0.0",   # accept connections from any network address
        port=5001,         # the port number (must match what React calls)
        debug=True         # debug=True → auto-restart when you edit app.py
                           # IMPORTANT: set debug=False before going live!
    )
