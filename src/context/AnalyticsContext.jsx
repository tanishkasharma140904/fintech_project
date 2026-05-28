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
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth, db } from '../firebase';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';

const API_BASE = 'http://localhost:5001';

const AnalyticsContext = createContext(null);

const saveTransactionsToFirestore = async (userId, txns) => {
  try {
    const txnsColRef = collection(db, "users", userId, "transactions");
    
    // 1. Delete all existing transaction docs for this user if any exist
    const snapshot = await getDocs(txnsColRef);
    if (!snapshot.empty) {
      const deleteBatch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
    }
    
    // 2. Write new transactions in batches of 500
    const BATCH_LIMIT = 500;
    for (let i = 0; i < txns.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = txns.slice(i, i + BATCH_LIMIT);
      
      chunk.forEach((txn) => {
        const docRef = doc(txnsColRef);
        batch.set(docRef, {
          amount: Number(txn.amount),
          category: txn.category || "Other",
          date: txn.date || null,
          merchant: txn.description || "",
          description: txn.description || "",
          type: txn.type || "debit",
          createdAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
    }
    console.log(`Saved ${txns.length} transactions to Firestore.`);
  } catch (error) {
    console.error("Error saving transactions to Firestore:", error);
  }
};

export function AnalyticsProvider({ children }) {
  const { currentUser, isDemoMode } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [filename, setFilename] = useState('');
  const [fileCount, setFileCount] = useState(0);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

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

        // Save ONLY the processed transaction data to Cloud Firestore
        if (currentUser) {
          if (isDemoMode) {
            localStorage.setItem(`artho_mock_db_${currentUser.uid}_transactions`, JSON.stringify(data.analytics.transactions || []));
            console.log('Saved transactions to Mock local storage.');
          } else {
            await saveTransactionsToFirestore(currentUser.uid, data.analytics.transactions || []);
          }
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Upload failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Cannot reach server. Is Flask running on port 5001?');
      console.error('Upload error:', err);
    }
  }, [currentUser, isDemoMode]);

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

        // Save the combined list of transactions to Firestore after merging
        if (currentUser) {
          if (isDemoMode) {
            localStorage.setItem(`artho_mock_db_${currentUser.uid}_transactions`, JSON.stringify(data.analytics.transactions || []));
            console.log('Saved merged transactions to Mock local storage.');
          } else {
            await saveTransactionsToFirestore(currentUser.uid, data.analytics.transactions || []);
          }
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Merge failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Cannot reach server. Is Flask running on port 5001?');
      console.error('Merge error:', err);
    }
  }, [currentUser, isDemoMode]);

  const reset = useCallback(async () => {
    setAnalytics(null);
    setTransactions([]);
    setStatus('idle');
    setMessage('');
    setFilename('');
    setFileCount(0);
    setHasAttemptedRestore(true);

    // Delete transactions from Firestore on reset
    if (currentUser) {
      if (isDemoMode) {
        localStorage.removeItem(`artho_mock_db_${currentUser.uid}_transactions`);
        console.log('Successfully cleared transactions from local storage.');
      } else {
        try {
          const txnsColRef = collection(db, "users", currentUser.uid, "transactions");
          const snapshot = await getDocs(txnsColRef);
          if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
          }
          console.log('Successfully cleared transactions from Cloud Firestore.');
        } catch (err) {
          console.error('Error clearing transactions from Firestore on reset:', err);
        }
      }
    }
  }, [currentUser, isDemoMode]);

  // Auto-restore previously uploaded CSV data from Firestore on login/refresh
  useEffect(() => {
    if (currentUser && !hasAttemptedRestore && status === 'idle') {
      setHasAttemptedRestore(true);
      
      const restorePreviousSession = async () => {
        try {
          let txns = [];
          if (isDemoMode) {
            const stored = localStorage.getItem(`artho_mock_db_${currentUser.uid}_transactions`);
            if (stored) {
              txns = JSON.parse(stored);
            }
          } else {
            const txnsColRef = collection(db, "users", currentUser.uid, "transactions");
            const snapshot = await getDocs(txnsColRef);
            if (!snapshot.empty) {
              txns = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  amount: Number(data.amount),
                  category: data.category,
                  date: data.date,
                  description: data.description || data.merchant || "",
                  type: data.type
                };
              });
            }
          }

          if (txns.length > 0) {
            setStatus('loading');
            setMessage('Restoring your previous session...');

            // Call Flask backend to compute analytics using restored transaction list
            const response = await fetch(`${API_BASE}/process-transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ transactions: txns })
            });

            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
              setAnalytics(data.analytics);
              setTransactions(data.analytics.transactions || []);
              setFilename('Cloud Ledger');
              setFileCount(1);
              setStatus('success');
              setMessage('Previous session successfully restored from Cloud Firestore.');
            } else {
              setStatus('idle');
              setMessage('');
            }
          }
        } catch (err) {
          console.warn('Failed to restore session from Firestore:', err);
          setStatus('idle');
          setMessage('');
        }
      };
      
      restorePreviousSession();
    }
  }, [currentUser, isDemoMode, hasAttemptedRestore, status]);

  // Reset hasAttemptedRestore and analytics states on logout
  useEffect(() => {
    if (!currentUser) {
      setHasAttemptedRestore(false);
      setAnalytics(null);
      setTransactions([]);
      setStatus('idle');
      setMessage('');
      setFilename('');
      setFileCount(0);

      // Wipe the Flask in-memory session store to enforce user-isolation
      fetch(`${API_BASE}/clear-transactions`, { method: 'POST' }).catch(() => {});
    }
  }, [currentUser]);

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


