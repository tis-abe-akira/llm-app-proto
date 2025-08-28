import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Chat } from './components/Chat';
import { BotManagement } from './components/BotManagement';

function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col bg-gray-100">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/chat" element={<Chat />} />
            <Route path="/bots" element={<BotManagement />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App
