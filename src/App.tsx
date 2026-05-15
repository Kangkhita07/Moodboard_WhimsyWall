import { useEffect, useState } from 'react';
import './App.css';
import BoardSelectionPage from './pages/BoardSelectionPage';
import BoardViewPage from './pages/BoardViewPage';
import LandingPage from './pages/LandingPage';

export type BoardType = 'cork' | 'white';
type AppPage = 'landing' | 'board' | 'view';

type AppLocation = {
  page: AppPage;
  selectedBoard: BoardType;
};

const isBoardType = (board: string | null): board is BoardType =>
  board === 'cork' || board === 'white';

const readLocation = (): AppLocation => {
  if (typeof window === 'undefined') {
    return {
      page: 'landing',
      selectedBoard: 'cork',
    };
  }

  const { pathname, search } = window.location;
  const board = new URLSearchParams(search).get('board');
  const selectedBoard = isBoardType(board) ? board : 'cork';

  if (pathname === '/boards') {
    return {
      page: 'board',
      selectedBoard,
    };
  }

  if (pathname === '/view') {
    return {
      page: 'view',
      selectedBoard,
    };
  }

  return {
    page: 'landing',
    selectedBoard,
  };
};

const getPathForLocation = ({ page, selectedBoard }: AppLocation) => {
  if (page === 'board') {
    return '/boards';
  }

  if (page === 'view') {
    return `/view?board=${selectedBoard}`;
  }

  return '/';
};

function App() {
  const [location, setLocation] = useState<AppLocation>(() => readLocation());
  const { page, selectedBoard } = location;

  const navigate = (nextLocation: AppLocation) => {
    window.history.pushState(nextLocation, '', getPathForLocation(nextLocation));
    setLocation(nextLocation);
  };

  useEffect(() => {
    window.history.replaceState(location, '', getPathForLocation(location));

    const handlePopState = () => {
      setLocation(readLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (page === 'landing') {
    return (
      <LandingPage
        onStart={() => navigate({ page: 'board', selectedBoard })}
      />
    );
  }

  if (page === 'board') {
    return (
      <BoardSelectionPage
        onBack={() => navigate({ page: 'landing', selectedBoard })}
        onSelect={(board) => {
          navigate({ page: 'view', selectedBoard: board });
        }}
      />
    );
  }

  if (page === 'view') {
    return (
      <BoardViewPage
        boardType={selectedBoard}
        onBack={() => navigate({ page: 'board', selectedBoard })}
      />
    );
  }

  return null;
}

export default App;
