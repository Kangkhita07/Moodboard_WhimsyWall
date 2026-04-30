import { useState } from 'react';
import './App.css';
import BoardSelectionPage from './pages/BoardSelectionPage';
import LandingPage from './pages/LandingPage';

function App() {
  const [page, setPage] = useState('landing');

  if (page === 'landing') {
    return <LandingPage onStart={() => setPage('board')} />;
  }

  if (page === 'board') {
    return <BoardSelectionPage onBack={() => setPage('landing')} />;
  }

  return null;
}

export default App;
