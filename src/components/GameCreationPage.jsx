import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import GameForm from './GameForm';
import styles from './GameCreationPage.module.css';

function GameCreationPage() {
  const [searchParams] = useSearchParams();
  const [locationName, setLocationName] = useState('Loading...');
  const navigate = useNavigate();
  
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));

  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        
        // Extract readable location name
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city) parts.push(data.address.city);
        
        setLocationName(parts.join(', ') || 'Tel Aviv, Israel');
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocationName('Tel Aviv, Israel');
      }
    };

    if (lat && lng) {
      fetchLocationName();
    }
  }, [lat, lng]);

  if (!lat || !lng) {
    return (
      <div className={styles.container}>
        <p>מיקום לא חוקי. אנא בחר מיקום על המפה תחילה.</p>
        <Link to="/">← חזרה למפה</Link>
      </div>
    );
  }

  const location = { lat, lng };

  const handleSuccess = () => {
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← חזרה למפה</Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>יצירת משחק חדש</h1>
        <p className={styles.locationInfo}>
          📍 {locationName}
        </p>
      </header>

      <div className={styles.formWrapper}>
        <GameForm location={location} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}

export default GameCreationPage;
