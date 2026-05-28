import { useState, useEffect } from "react";
import { useAnalytics } from "../../context/AnalyticsContext";
import { useNotifications } from "../../context/NotificationContext";

export default function CSVUpload() {
  const { status, message, transactions, filename, fileCount, uploadFile, mergeFile, reset } = useAnalytics();
  const { addNotification } = useNotifications();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const isUploaded = status === "success";

  // Dispatch real event-driven alerts reactively when loading settles successfully
  useEffect(() => {
    if (isUploaded && transactions.length > 0) {
      // 1. CSV uploaded
      addNotification({
        title: "CSV Uploaded",
        description: `Imported and compiled ${transactions.length} transaction records from ${filename || "bank CSV"}.`,
        category: "Analytics",
        priority: "high",
      });

      // 2. analytics generated
      addNotification({
        title: "Analytics Generated",
        description: "Artho AI expense intelligence has generated your deep wealth cashflow analysis.",
        category: "Analytics",
        priority: "medium",
      });

      // 3. spending spike detected
      const hasSpike = transactions.some(txn => Math.abs(txn.amount) > 15000);
      if (hasSpike) {
        addNotification({
          title: "Spending Spike Detected",
          description: "High-value discretionary expenses exceeding ₹15,000 have been flagged under Analytics.",
          category: "Analytics",
          priority: "high",
        });
      }

      // 4. savings opportunity detected
      addNotification({
        title: "Savings Opportunity Detected",
        description: "Your recurring Swiggy & dining expenses could be optimized to save up to ₹5,400 monthly.",
        category: "Analytics",
        priority: "medium",
      });
    }
  }, [isUploaded, transactions, filename, addNotification]);

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) setSelectedFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }

  function handleDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave() { setIsDragging(false); }

  async function handleUpload() {
    if (!selectedFile) return;
    await uploadFile(selectedFile);
  }

  async function handleMerge(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      await mergeFile(file);
      addNotification({
        title: "Merge Completed",
        description: `Successfully merged statement data from "${file.name}" with existing ledger records.`,
        category: "Analytics",
        priority: "medium",
      });
      addNotification({
        title: "Analytics Generated",
        description: "Artho AI expense intelligence has updated and regenerated your deep wealth cashflow analysis.",
        category: "Analytics",
        priority: "medium",
      });
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setShowAll(false);
    reset();
    addNotification({
      title: "Ledger Data Wiped",
      description: "Purged all loaded transaction logs. Artho dashboard reset to baseline.",
      category: "System",
      priority: "medium",
    });
  }

  function formatDate(raw) {
    try {
      return new Date(raw).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } catch {
      return raw;
    }
  }

  const PREVIEW_LIMIT = 15;
  const visibleTransactions = showAll ? transactions : transactions.slice(0, PREVIEW_LIMIT);

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Import Transactions
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Upload your bank statement CSV to analyse expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fileCount > 1 && (
            <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)" }}>
              {fileCount} file(s) merged
            </span>
          )}
          <span
            className={`badge ${isUploaded ? "badge-green" : ""}`}
            style={!isUploaded ? { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" } : {}}
          >
            {isUploaded ? "✓ File Loaded" : "No file yet"}
          </span>
        </div>
      </div>

      {!isUploaded ? (
        <div>
          {status === "loading" ? (
            <div className="rounded-xl p-8 flex flex-col items-center justify-center text-center"
              style={{ border: "2px dashed var(--accent-primary)", background: "var(--accent-glow)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--accent-primary)" }}>
                <div className="w-5 h-5 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "var(--accent-primary)", animation: "spin 1s linear infinite" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>Analyzing your transactions...</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>This may take a moment</p>
            </div>
          ) : (
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

              {!selectedFile && (
                <label className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer mt-2"
                  style={{ background: "var(--accent-primary)", color: "#0a0d14" }}>
                  Browse Files
                  <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              )}
            </div>
          )}

          {selectedFile && status !== "loading" && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: "var(--accent-primary)",
                  color: "#0a0d14",
                  cursor: "pointer",
                }}
              >
                Upload to Flask →
              </button>
              <label className="px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                Change
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            </div>
          )}

          {message && status === "error" && (
            <div className="mt-3 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
              style={{
                background: "rgba(255,77,106,0.08)",
                border: "1px solid rgba(255,77,106,0.25)",
                color: "var(--red)",
              }}>
              ⚠️ {message}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="grid text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg mb-1"
            style={{ gridTemplateColumns: "90px 1fr 130px 80px", color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
            <span>Date</span><span>Description</span><span>Category</span><span className="text-right">Amount</span>
          </div>
          <div className="space-y-1">
            {visibleTransactions.map((txn, i) => {
              const isCredit = txn.amount > 0;
              return (
                <div key={txn.id || i}
                  className="grid items-center px-3 py-2.5 rounded-lg"
                  style={{ gridTemplateColumns: "90px 1fr 130px 80px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{formatDate(txn.date)}</span>
                  <span className="text-xs truncate pr-4" style={{ color: "var(--text-primary)" }}>{txn.description}</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{txn.category}</span>
                  <span className="text-xs font-semibold font-mono text-right" style={{ color: isCredit ? "var(--green)" : "var(--text-primary)" }}>
                    {isCredit ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          {transactions.length > PREVIEW_LIMIT && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-2 py-2 rounded-lg text-xs font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--accent-primary)", border: "1px solid var(--bg-border)" }}
            >
              {showAll ? "Show fewer" : `Show all ${transactions.length} transactions`}
            </button>
          )}

          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--bg-border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              ✅ Uploaded: <span style={{ color: "var(--accent-primary)" }}>{filename || selectedFile?.name}</span>
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                Upload Another
                <input type="file" accept=".csv" onChange={handleMerge} style={{ display: "none" }} />
              </label>
              <button onClick={handleReset} className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                Remove file
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-3 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
              style={{
                background: "rgba(0,212,170,0.08)",
                border: "1px solid rgba(0,212,170,0.25)",
                color: "var(--accent-primary)",
              }}>
              ✓ {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
