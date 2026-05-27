// ============================================================
// FILE: src/components/expenses/CSVUpload.jsx  (UPDATED)
// PURPOSE: Upload a real CSV file to the Flask backend.
//
// WHAT'S NEW vs the previous version:
//   + handleUpload() function that calls Flask via fetch()
//   + uploadStatus state to show loading / success / error
//   + The file is sent as FormData (the only way to send files)
//
// KEY CONCEPT — FormData:
//   When sending a file over HTTP, you can't just send the
//   filename as text. You need FormData — a special object
//   that packages binary file data for HTTP transmission.
//   It's the same thing HTML <form enctype="multipart/form-data">
//   does, but controlled by JavaScript.
// ============================================================

import { useState } from "react";
import { sampleTransactions } from "../../data/expenseData";

// The Flask server URL — change this if your Flask runs elsewhere
// In production this would be your real domain
const API_BASE = "http://localhost:5001";

export default function CSVUpload() {
  const [isUploaded, setIsUploaded]     = useState(false);
  const [isDragging, setIsDragging]     = useState(false);

  // NEW states for tracking the upload to Flask
  const [selectedFile, setSelectedFile] = useState(null);   // holds the File object
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | loading | success | error
  const [statusMessage, setStatusMessage] = useState("");   // message from Flask response

  // ── Step 1: User picks a file ────────────────────────────
  // This runs when they choose a file — we just store it, don't upload yet
  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus("idle");
      setStatusMessage("");
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus("idle");
    }
  }

  function handleDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave()  { setIsDragging(false); }

  // ── Step 2: User clicks "Upload to Flask" ────────────────
  // This is where the actual HTTP POST happens
  async function handleUpload() {
    if (!selectedFile) return;

    // Show loading state immediately
    setUploadStatus("loading");
    setStatusMessage("Sending to server...");

    try {
      // FormData packages the file for HTTP transmission
      // Think of it as putting the file in an envelope
      const formData = new FormData();

      // formData.append("file", selectedFile)
      //   "file"        → the field name Flask reads with request.files["file"]
      //   selectedFile  → the actual File object from the browser
      // ⚠️ The field name "file" MUST match what Flask expects!
      formData.append("file", selectedFile);

      // fetch() is the browser's built-in HTTP request function
      // It returns a Promise — we use async/await to handle it cleanly
      const response = await fetch(`${API_BASE}/upload-expense`, {
        method: "POST",       // POST because we're SENDING data
        body: formData,       // the envelope containing our file
        // NOTE: Do NOT set Content-Type header manually with FormData!
        // The browser sets it automatically with the correct "boundary"
      });

      // response.json() reads the JSON body Flask sent back
      // Also returns a Promise — so we await it too
      const data = await response.json();

      if (response.ok) {
        // response.ok = true when HTTP status is 200-299
        setUploadStatus("success");
        setStatusMessage(data.message);
        setIsUploaded(true);    // show the transactions preview table
      } else {
        // Flask returned a 400 or 500 error
        setUploadStatus("error");
        setStatusMessage(data.message || "Upload failed.");
      }

    } catch (err) {
      // This catches network errors — e.g. Flask isn't running
      setUploadStatus("error");
      setStatusMessage("Cannot reach the server. Is Flask running on port 5000?");
      console.error("Upload error:", err);
    }
  }

  function handleReset() {
    setIsUploaded(false);
    setSelectedFile(null);
    setUploadStatus("idle");
    setStatusMessage("");
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Import Transactions
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Upload your bank statement CSV to analyse expenses
          </p>
        </div>
        <span
          className={`badge ${isUploaded ? "badge-green" : ""}`}
          style={!isUploaded ? { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" } : {}}
        >
          {isUploaded ? "✓ File Loaded" : "No file yet"}
        </span>
      </div>

      {!isUploaded ? (
        <div>
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 mb-4"
            style={{
              border: `2px dashed ${isDragging ? "var(--accent-primary)" : "var(--bg-border)"}`,
              background: isDragging ? "var(--accent-glow)" : "var(--bg-elevated)",
            }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-primary)" }}>
                <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>

            {/* Show selected filename, or the default prompt */}
            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>
                  📄 {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — ready to upload
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  Drag & drop your CSV here
                </p>
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  Supports HDFC, ICICI, SBI, Axis bank formats
                </p>
              </div>
            )}

            {/* Browse Files button */}
            {!selectedFile && (
              <label className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer mt-2"
                style={{ background: "var(--accent-primary)", color: "#0a0d14" }}>
                Browse Files
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {/* Action buttons — only show after a file is selected */}
          {selectedFile && (
            <div className="flex items-center gap-3">

              {/* Upload to Flask button */}
              <button
                onClick={handleUpload}
                disabled={uploadStatus === "loading"}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: uploadStatus === "loading" ? "var(--bg-elevated)" : "var(--accent-primary)",
                  color: uploadStatus === "loading" ? "var(--text-muted)" : "#0a0d14",
                  cursor: uploadStatus === "loading" ? "not-allowed" : "pointer",
                }}
              >
                {uploadStatus === "loading" ? "Uploading..." : "Upload to Flask →"}
              </button>

              {/* Change file */}
              <label className="px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                Change
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            </div>
          )}

          {/* Status message from Flask */}
          {statusMessage && (
            <div className="mt-3 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
              style={{
                background: uploadStatus === "error" ? "rgba(255,77,106,0.08)" : "rgba(0,212,170,0.08)",
                border: `1px solid ${uploadStatus === "error" ? "rgba(255,77,106,0.25)" : "rgba(0,212,170,0.25)"}`,
                color: uploadStatus === "error" ? "var(--red)" : "var(--accent-primary)",
              }}>
              {uploadStatus === "error" ? "⚠️" : "✓"} {statusMessage}
            </div>
          )}
        </div>

      ) : (
        /* Transaction preview table (same as before) */
        <div>
          <div className="grid text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg mb-1"
            style={{ gridTemplateColumns: "90px 1fr 130px 80px", color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
            <span>Date</span><span>Description</span><span>Category</span><span className="text-right">Amount</span>
          </div>
          <div className="space-y-1">
            {sampleTransactions.map((txn) => {
              const isCredit = txn.amount > 0;
              return (
                <div key={txn.id}
                  className="grid items-center px-3 py-2.5 rounded-lg"
                  style={{ gridTemplateColumns: "90px 1fr 130px 80px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{txn.date.slice(5)}</span>
                  <span className="text-xs truncate pr-4" style={{ color: "var(--text-primary)" }}>{txn.description}</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{txn.category}</span>
                  <span className="text-xs font-semibold font-mono text-right" style={{ color: isCredit ? "var(--green)" : "var(--text-primary)" }}>
                    {isCredit ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--bg-border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              ✅ Uploaded: <span style={{ color: "var(--accent-primary)" }}>{selectedFile?.name}</span>
            </p>
            <button onClick={handleReset} className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
              Remove file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
