// ============================================================
// FILE: src/hooks/useExpenseAnalytics.js
// PURPOSE: Custom React hook — manages upload state, calls Flask,
//          stores analytics data, and shares it with any component.
//
// WHAT IS A CUSTOM HOOK?
//   A hook is a regular JavaScript function whose name starts
//   with "use". It can call useState and other hooks inside it.
//   You use it exactly like useState — call it at the top of
//   any component and get back state + functions.
//
//   BEFORE hooks: you'd repeat fetch logic in every component.
//   AFTER hooks:  write the logic once here, reuse everywhere.
//
// HOW TO USE IN A COMPONENT:
//   import { useExpenseAnalytics } from '../hooks/useExpenseAnalytics';
//   const { analytics, uploadFile, status } = useExpenseAnalytics();
// ============================================================
 
import { useState } from "react";
 
const API_BASE = "http://localhost:5000";
 
// The hook function — starts with "use" (React rule)
export function useExpenseAnalytics() {
 
  // ── State ─────────────────────────────────────────────────
 
  // analytics holds the data object from Flask.
  // Starts as null (no data yet).
  // After upload: { total_spending, by_category, by_month, ... }
  const [analytics, setAnalytics] = useState(null);
 
  // status tracks where we are in the upload process
  // "idle" | "loading" | "success" | "error"
  const [status, setStatus] = useState("idle");
 
  // message is the human-readable feedback string
  const [message, setMessage] = useState("");
 
  // filename stores the uploaded file's name for display
  const [filename, setFilename] = useState("");
 
 
  // ── uploadFile function ───────────────────────────────────
  // This is the main function components will call.
  // It takes a File object (from an <input type="file">).
  // It's async because fetch() returns a Promise.
 
  async function uploadFile(file) {
    if (!file) return;
 
    // Reset state before starting
    setStatus("loading");
    setMessage("Reading your CSV...");
    setAnalytics(null);
 
    try {
      // Package the file for HTTP transmission
      const formData = new FormData();
      formData.append("file", file);  // "file" must match Flask's request.files["file"]
 
      // Send POST request to Flask
      const response = await fetch(`${API_BASE}/upload-expense`, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type — browser sets it with correct boundary
      });
 
      // Parse the JSON body Flask sent back
      const data = await response.json();
 
      if (response.ok && data.status === "success") {
        // ✅ Success: store analytics and update state
        setAnalytics(data.analytics);  // the whole analytics object from Flask
        setFilename(file.name);
        setStatus("success");
        setMessage(data.message);
      } else {
        // Flask returned an error response
        setStatus("error");
        setMessage(data.message || "Upload failed.");
      }
 
    } catch (err) {
      // Network error — Flask probably isn't running
      setStatus("error");
      setMessage("Cannot reach server. Is Flask running on port 5000?");
      console.error("Upload error:", err);
    }
  }
 
 
  // ── reset function ────────────────────────────────────────
  // Clears all state back to the initial "idle" state
  function reset() {
    setAnalytics(null);
    setStatus("idle");
    setMessage("");
    setFilename("");
  }
 
 
  // ── Return everything components need ─────────────────────
  // Components destructure this: const { analytics, uploadFile } = useExpenseAnalytics()
  return {
    analytics,    // the data object (null until upload succeeds)
    status,       // "idle" | "loading" | "success" | "error"
    message,      // human-readable status string
    filename,     // name of the uploaded file
    uploadFile,   // function to call with a File object
    reset,        // function to clear all state
  };
}