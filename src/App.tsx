import { useState } from 'react';
import './App.css';
import BoardSelectionPage from './pages/BoardSelectionPage';
import BoardViewPage from './pages/BoardViewPage';
import LandingPage from './pages/LandingPage';

export type BoardType = 'cork' | 'white';
type AppPage = 'landing' | 'board' | 'view';

function App() {
  const [page, setPage] = useState<AppPage>('landing');
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('cork');

  if (page === 'landing') {
    return <LandingPage onStart={() => setPage('board')} />;
  }

  if (page === 'board') {
    return (
      <BoardSelectionPage
        onBack={() => setPage('landing')}
        onSelect={(board) => {
          setSelectedBoard(board);
          setPage('view');
        }}
      />
    );
  }

  if (page === 'view') {
    return (
      <BoardViewPage
        boardType={selectedBoard}
        onBack={() => setPage('board')}
      />
    );
  }

  return null;
}

export default App;
