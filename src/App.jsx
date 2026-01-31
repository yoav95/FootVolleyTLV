import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GameCreationPage from './components/GameCreationPage';
import GameDetailsPage from './components/GameDetailsPage';
import styles from './App.module.css';

function App() {
  return (
    <Router>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create-game" element={<GameCreationPage />} />
          <Route path="/game/:gameId" element={<GameDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
