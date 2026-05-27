/**
 * AnalyticsContext — central state management for all analytics data.
 *
 * Provides:
 *   analytics   – full analytics object from backend (null before upload)
 *   transactions – parsed transaction array ([] before upload)
 *   status      – 'idle' | 'loading' | 'success' | 'error'
 *   message     – human-readable status string
 *   filename    – current uploaded filename
 *   fileCount   – number of files uploaded (for merge tracking)
 *   uploadFile(file)  – async, upload a CSV
 *   mergeFile(file)   – async, merge additional CSV
 *   reset()           – clear all state
 */
import { createContext, useContext, useState, useCallback } from 'react';

const API_BASE = 'http://localhost:5001';

const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [filename, setFilename] = useState('');
  const [fileCount, setFileCount] = useState(0);

  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    setStatus('loading');
    setMessage('Analyzing your transactions...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload-expense`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setAnalytics(data.analytics);
        setTransactions(data.analytics.transactions || []);
        setFilename(file.name);
        setFileCount(1);
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Upload failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Cannot reach server. Is Flask running on port 5001?');
      console.error('Upload error:', err);
    }
  }, []);

  const mergeFile = useCallback(async (file) => {
    if (!file) return;
    setStatus('loading');
    setMessage('Merging transactions...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload-merge`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setAnalytics(data.analytics);
        setTransactions(data.analytics.transactions || []);
        setFileCount(prev => prev + 1);
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Merge failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Cannot reach server. Is Flask running on port 5001?');
      console.error('Merge error:', err);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalytics(null);
    setTransactions([]);
    setStatus('idle');
    setMessage('');
    setFilename('');
    setFileCount(0);
  }, []);

  return (
    <AnalyticsContext.Provider value={{
      analytics,
      transactions,
      status,
      message,
      filename,
      fileCount,
      uploadFile,
      mergeFile,
      reset,
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
