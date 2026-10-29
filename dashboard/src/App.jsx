import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import MarketAnalysis from './pages/MarketAnalysis';
import AgentExplorer from './pages/AgentExplorer';
import Predictions from './pages/Predictions';
import Playback from './pages/Playback';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/market" element={<MarketAnalysis />} />
          <Route path="/agents" element={<AgentExplorer />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/playback" element={<Playback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
