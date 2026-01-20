import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import LocationPage from './components/LocationPage';
import styles from './App.module.css';

function App() {
  return (
    <Router>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/location/:locationId" element={<LocationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
