import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';
import { onAuthChange } from './firebase/authService';
import HomePage from './components/HomePage';
import GameCreationPage from './components/GameCreationPage';
import GameDetailsPage from './components/GameDetailsPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import styles from './App.module.css';

export const AuthContext = createContext(null);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className={styles.loadingContainer}>טוען...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      <Router>
        <div className={styles.app}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/create-game" element={<GameCreationPage />} />
            <Route path="/game/:gameId" element={<GameDetailsPage />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
