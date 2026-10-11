import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CollectData from './pages/CollectData';
import DataQuality from './pages/DataQuality';
import CleanDataset from './pages/CleanDataset';
import ExploreData from './pages/ExploreData';
import DatasetHistory from './pages/DatasetHistory';
import {
  getStoredHistory,
  saveToHistory,
  clearHistory,
  getActiveWorkspace,
  saveActiveWorkspace
} from './services/storage';
import { loadSampleDataset } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeDataset, setActiveDataset] = useState(null);
  const [history, setHistory] = useState([]);

  // Load initial history and active dataset from browser storage on mount
  useEffect(() => {
    const storedHist = getStoredHistory();
    setHistory(storedHist);

    const savedWorkspace = getActiveWorkspace();
    if (savedWorkspace) {
      setActiveDataset(savedWorkspace);
    }
  }, []);

  // Compute session metrics dynamically
  const sessionStats = {
    datasetsCollected: history.length,
    totalRecords: history.reduce((acc, item) => acc + (item.total_rows || 0), 0),
    qualityIssuesDetected: history.reduce((acc, item) => acc + (item.issues_count || 0), 0),
    datasetsCleaned: history.filter((item) => item.is_cleaned).length
  };

  const handleDatasetLoaded = (dataset) => {
    setActiveDataset(dataset);
    saveActiveWorkspace(dataset);
    const updatedHistory = saveToHistory(dataset);
    setHistory(updatedHistory);
  };

  const handleDatasetCleaned = (cleanedResult) => {
    if (!activeDataset) return;
    const updatedDataset = {
      ...activeDataset,
      cleaned_data: cleanedResult
    };
    setActiveDataset(updatedDataset);
    saveActiveWorkspace(updatedDataset);
    const updatedHistory = saveToHistory(updatedDataset);
    setHistory(updatedHistory);
  };

  const handleLoadDatasetFromHistory = async (id) => {
    // If it's already active, just switch to quality or explore
    if (activeDataset?.id === id) {
      setCurrentPage('quality');
      return;
    }

    // If it is a known sample dataset, reload it fresh from server
    if (id === 'student_performance' || id === 'house_prices') {
      try {
        const dataset = await loadSampleDataset(id);
        handleDatasetLoaded(dataset);
        setCurrentPage('quality');
        return;
      } catch (err) {
        console.warn('Could not reload sample from server:', err);
      }
    }

    // Check if current workspace has this ID
    const saved = getActiveWorkspace();
    if (saved && saved.id === id) {
      setActiveDataset(saved);
      setCurrentPage('quality');
      return;
    }

    // Otherwise navigate to collect
    setCurrentPage('collect');
  };

  const handleClearHistory = () => {
    const cleared = clearHistory();
    setHistory(cleared);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        activeDataset={activeDataset}
      />

      <div className="main-layout">
        <Header
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          activeDataset={activeDataset}
        />

        <main className="content-body">
          {currentPage === 'dashboard' && (
            <Dashboard
              sessionStats={sessionStats}
              activeDataset={activeDataset}
              history={history}
              setCurrentPage={setCurrentPage}
              onLoadDatasetFromHistory={handleLoadDatasetFromHistory}
            />
          )}

          {currentPage === 'collect' && (
            <CollectData
              onDatasetLoaded={handleDatasetLoaded}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'quality' && (
            <DataQuality
              activeDataset={activeDataset}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'clean' && (
            <CleanDataset
              activeDataset={activeDataset}
              onDatasetCleaned={handleDatasetCleaned}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'explore' && (
            <ExploreData
              activeDataset={activeDataset}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'history' && (
            <DatasetHistory
              activeDataset={activeDataset}
              history={history}
              onLoadDatasetFromHistory={handleLoadDatasetFromHistory}
              onClearHistory={handleClearHistory}
              setCurrentPage={setCurrentPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
