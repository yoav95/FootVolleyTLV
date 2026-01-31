import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { games } from '../data/mockData';
import styles from './GameDetailsPage.module.css';

function GameDetailsPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = games.find(g => g.id === gameId);
  const [address, setAddress] = useState('Loading...');

  // Fetch address from coordinates
  useEffect(() => {
    if (game && game.coordinates) {
      const fetchAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${game.coordinates.lat}&lon=${game.coordinates.lng}`
          );
          const data = await response.json();
          
          // Extract a readable address
          const addressParts = [];
          if (data.address.road) addressParts.push(data.address.road);
          if (data.address.neighbourhood) addressParts.push(data.address.neighbourhood);
          if (data.address.suburb) addressParts.push(data.address.suburb);
          if (data.address.city) addressParts.push(data.address.city);
          
          setAddress(addressParts.join(', ') || 'Tel Aviv, Israel');
        } catch (error) {
          console.error('Error fetching address:', error);
          setAddress('Tel Aviv, Israel');
        }
      };
      fetchAddress();
    }
  }, [game]);

  if (!game) {
    return (
      <div className={styles.container}>
        <p>משחק לא נמצא.</p>
        <Link to="/">← חזרה למפה</Link>
      </div>
    );
  }

  const handleJoinGame = () => {
    game.currentPlayers += 1;
    // In a real app, this would save to a database
    alert(`הצטרפת למשחק של ${game.organizer}!`);
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← חזרה למפה</Link>
      
      <div className={styles.gameCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>משחק של {game.organizer}</h1>
          <span className={`${styles.level} ${styles[game.level.toLowerCase().replace(/\s+/g, '-')]}`}>
            {game.level}
          </span>
        </header>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📅 תאריך ושעה</h3>
            <p className={styles.detail}>{game.date} ב-{game.time}</p>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>👥 שחקנים</h3>
            <div className={styles.players}>
              <p className={styles.detail}>
                {game.currentPlayers} / {game.playersNeeded} שחקנים
              </p>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progress} 
                  style={{ width: `${(game.currentPlayers / game.playersNeeded) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📍 מיקום</h3>
            <div className={styles.meetingPointContainer}>
              <div className={styles.meetingPointInfo}>
                <p className={styles.detail}>{address}</p>
                {game.meetingPointText && (
                  <p className={styles.meetingPoint}>{game.meetingPointText}</p>
                )}
              </div>
              <div className={styles.meetingPointImage}>
                {game.meetingPointImage ? (
                  <img src={game.meetingPointImage} alt="נקודת מפגש" />
                ) : (
                  <div className={styles.imagePlaceholder}>📸 אין תמונה</div>
                )}
              </div>
            </div>
          </div>

          {game.notes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📝 הערות</h3>
              <p className={styles.detail}>{game.notes}</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {game.currentPlayers < game.playersNeeded ? (
            <button onClick={handleJoinGame} className={styles.joinBtn}>
              הצטרפות למשחק
            </button>
          ) : (
            <button className={styles.fullBtn} disabled>
              המשחק מלא
            </button>
          )}
          <button onClick={() => navigate('/')} className={styles.cancelBtn}>
            חזרה
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameDetailsPage;
