import styles from './GameCard.module.css';

function GameCard({ game }) {
  const spotsLeft = game.playersNeeded - game.currentPlayers;
  const isFull = spotsLeft === 0;

  return (
    <div className={`${styles.card} ${isFull ? styles.full : ''}`}>
      <div className={styles.header}>
        <div className={styles.date}>
          <span className={styles.dateDay}>{new Date(game.date).getDate()}</span>
          <span className={styles.dateMonth}>
            {new Date(game.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
        </div>
        <div className={styles.time}>{game.time}</div>
      </div>

      <div className={styles.level}>
        <span className={styles.levelBadge}>{game.level}</span>
      </div>

      <div className={styles.organizer}>
        <strong>Organizer:</strong> {game.organizer}
      </div>

      <div className={styles.players}>
        <div className={styles.playersInfo}>
          <strong>Players:</strong> {game.currentPlayers} / {game.playersNeeded}
        </div>
        <div className={styles.spotsLeft}>
          {isFull ? (
            <span className={styles.fullText}>FULL</span>
          ) : (
            <span className={styles.spotsText}>{spotsLeft} spots left</span>
          )}
        </div>
      </div>

      {game.notes && (
        <div className={styles.notes}>
          <strong>Notes:</strong> {game.notes}
        </div>
      )}

      <button 
        className={styles.joinBtn}
        disabled={isFull}
      >
        {isFull ? 'Game Full' : 'Join Game'}
      </button>
    </div>
  );
}

export default GameCard;
