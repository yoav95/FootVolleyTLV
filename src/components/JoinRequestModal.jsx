import { useState } from 'react';
import { approveJoinRequest, rejectJoinRequest } from '../firebase/gameService';
import styles from './JoinRequestModal.module.css';

function JoinRequestModal({ request, userProfile, onClose, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await approveJoinRequest(request.gameId, request.userId, request.organizerId);
      onApprove(request.gameId, request.userId);
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה בקבלת הבקשה');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      await rejectJoinRequest(request.gameId, request.userId, request.organizerId);
      onReject(request.gameId, request.userId);
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה בדחיית הבקשה');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>📩 בקשה להצטרפות</h2>
        </div>

        <div className={styles.content}>
          <div className={styles.playerCard}>
            <div className={styles.playerInfo}>
              <div className={styles.playerName}>{userProfile?.name || 'שחקן'}</div>
              {userProfile?.level && (
                <div className={styles.playerLevel}>
                  רמה {userProfile.level}
                </div>
              )}
              {userProfile?.phone && (
                <div className={styles.playerPhone}>📱 {userProfile.phone}</div>
              )}
            </div>
          </div>

          <div className={styles.gameInfo}>
            <p className={styles.infoLabel}>משחק:</p>
            <p className={styles.gameDetails}>{request.gameName}</p>
            <p className={styles.gameTime}>📅 {request.date} ב-{request.time}</p>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            onClick={handleApprove}
            className={styles.approveBtn}
            disabled={loading}
          >
            {loading ? '⏳ מאשר...' : '✅ אישור'}
          </button>
          <button
            onClick={handleReject}
            className={styles.rejectBtn}
            disabled={loading}
          >
            {loading ? '⏳ דוחה...' : '❌ דחייה'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinRequestModal;
