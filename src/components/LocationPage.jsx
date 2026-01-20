import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLocationById, getGamesByLocation } from '../data/mockData';
import GameCard from './GameCard';
import GameForm from './GameForm';
import styles from './LocationPage.module.css';

function LocationPage() {
  const { locationId } = useParams();
  const location = getLocationById(locationId);
  const [games, setGames] = useState(getGamesByLocation(locationId));
  const [showForm, setShowForm] = useState(false);

  if (!location) {
    return (
      <div className={styles.container}>
        <p>Location not found</p>
        <Link to="/">← Back to Home</Link>
      </div>
    );
  }

  const handleAddGame = (newGame) => {
    const gameWithId = {
      ...newGame,
      id: Date.now().toString(),
      locationId: locationId,
      currentPlayers: 1
    };
    setGames([...games, gameWithId]);
    setShowForm(false);
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Back to Locations</Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>{location.name}</h1>
        <p className={styles.city}>{location.city}</p>
        <p className={styles.description}>{location.description}</p>
      </header>

      <div className={styles.actions}>
        <button 
          className={styles.organizeBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Organize a Game'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2>Organize a New Game</h2>
          <GameForm onSubmit={handleAddGame} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <section className={styles.gamesSection}>
        <h2 className={styles.sectionTitle}>Upcoming Games ({games.length})</h2>
        
        {games.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No games scheduled yet.</p>
            <p>Be the first to organize one!</p>
          </div>
        ) : (
          <div className={styles.gamesGrid}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default LocationPage;
