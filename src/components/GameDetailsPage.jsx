import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { getGameById, joinGame, leaveGame } from '../firebase/gameService';
import { AuthContext } from '../App';
import styles from './GameDetailsPage.module.css';

function GameDetailsPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [game, setGame] = useState(null);
  const [address, setAddress] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const gameData = await getGameById(gameId);
        if (gameData) {
          setGame(gameData);
        } else {
          setError('משחק לא נמצא');
        }
      } catch (err) {
        setError('שגיאה בטעינת המשחק');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

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

  if (loading) {
    return (
      <div className={styles.container}>
        <p>טוען...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className={styles.container}>
        <p>{error || 'משחק לא נמצא.'}</p>
        <Link to="/">← חזרה למפה</Link>
      </div>
    );
  }

  const handleJoinGame = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setActionLoading(true);
    try {
      await joinGame(gameId, currentUser.uid);
      const updatedGame = await getGameById(gameId);
      setGame(updatedGame);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      await leaveGame(gameId, currentUser.uid);
      const updatedGame = await getGameById(gameId);
      setGame(updatedGame);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
    // In a real app, this would save to a database
    alert(`הצטרפת למשחק!`);
  };

  const isUserInGame = currentUser && game.players && game.players.includes(currentUser.uid);
  const isFull = game.players && game.players.length >= game.playersNeeded;

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← חזרה למפה</Link>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.gameCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>משחק כדורעף</h1>
          <span className={`${styles.level} ${styles[`level-${game.level}`.toLowerCase()]}`}>
            רמה {game.level}
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
                {game.players?.length || 0} / {game.playersNeeded} שחקנים
              </p>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progress} 
                  style={{ width: `${((game.players?.length || 0) / game.playersNeeded) * 100}%` }}
                ></div>
              </div>
              {game.players && game.players.length > 0 && (
                <div className={styles.playersList}>
                  <h4 className={styles.playersListTitle}>רשימת השחקנים:</h4>
                  <ul className={styles.playerListItems}>
                    {game.players.map((playerId, index) => (
                      <li key={index} className={styles.playerItem}>
                        <span className={styles.playerNumber}>{index + 1}.</span>
                        <span className={styles.playerName}>{playerId === game.organizerId ? 'מארגן' : 'שחקן'}</span>
                        {playerId === game.organizerId && (
                          <span className={styles.organizerBadge}>🔸</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
          {!isUserInGame && !isFull ? (
            <button onClick={handleJoinGame} className={styles.joinBtn} disabled={actionLoading}>
              {actionLoading ? 'מצטרף...' : 'הצטרפות למשחק'}
            </button>
          ) : isUserInGame && !isFull ? (
            <button onClick={handleLeaveGame} className={styles.leaveBtn} disabled={actionLoading}>
              {actionLoading ? 'עוזב...' : 'עזיבה מהמשחק'}
            </button>
          ) : (
            <button className={styles.fullBtn} disabled>
              המשחק מלא
            </button>
          )}
          <button onClick={() => navigate('/')} className={styles.cancelBtn} disabled={actionLoading}>
            חזרה
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameDetailsPage;
