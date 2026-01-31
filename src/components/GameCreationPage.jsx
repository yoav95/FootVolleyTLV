import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { games } from '../data/mockData';
import GameForm from './GameForm';
import styles from './GameCreationPage.module.css';

function GameCreationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));

  if (!lat || !lng) {
    return (
      <div className={styles.container}>
        <p>מיקום לא חוקי. אנא בחר מיקום על המפה תחילה.</p>
        <Link to="/">← חזרה למפה</Link>
      </div>
    );
  }

  const handleAddGame = (formData) => {
    const newGame = {
      id: Date.now().toString(),
      coordinates: { lat, lng },
      date: formData.date,
      time: formData.time,
      organizer: formData.organizer,
      playersNeeded: parseInt(formData.playersNeeded),
      currentPlayers: 1,
      level: formData.level,
      notes: formData.notes,
      meetingPointImage: formData.meetingPointImage,
      meetingPointText: formData.meetingPointText
    };
    
    games.push(newGame);
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
          📍 {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      </header>

      <div className={styles.formWrapper}>
        <GameForm onSubmit={handleAddGame} onCancel={handleCancel} />
      </div>
    </div>
  );
}

export default GameCreationPage;
