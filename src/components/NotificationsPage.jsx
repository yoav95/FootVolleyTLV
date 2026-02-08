import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getOrganizerPendingRequests, approveJoinRequest, rejectJoinRequest } from '../firebase/gameService';
import { getUserProfile } from '../firebase/authService';
import styles from './NotificationsPage.module.css';

function NotificationsPage() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        const requests = await getOrganizerPendingRequests(currentUser.uid);
        setPendingRequests(requests);

        // Fetch user profiles for all requesters
        const profiles = {};
        for (const request of requests) {
          if (!profiles[request.userId]) {
            const profile = await getUserProfile(request.userId);
            profiles[request.userId] = profile;
          }
        }
        setUserProfiles(profiles);
      } catch (err) {
        setError('שגיאה בטעינת הבקשות');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [currentUser, navigate]);

  const handleApprove = async (gameId, userId) => {
    setActionLoading(true);
    try {
      await approveJoinRequest(gameId, userId, currentUser.uid);
      // Remove from list
      setPendingRequests(prev => 
        prev.filter(req => !(req.gameId === gameId && req.userId === userId))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (gameId, userId) => {
    setActionLoading(true);
    try {
      await rejectJoinRequest(gameId, userId, currentUser.uid);
      // Remove from list
      setPendingRequests(prev => 
        prev.filter(req => !(req.gameId === gameId && req.userId === userId))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>← חזרה למפה</Link>
        <div className={styles.loadingMessage}>טוען בקשות...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← חזרה למפה</Link>

      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>🔔 בקשות הצטרפות</h1>
          <p className={styles.subtitle}>
            {pendingRequests.length === 0 ? 'אין בקשות ממתינות' : `${pendingRequests.length} בקשות ממתינות`}
          </p>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {pendingRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>✨</p>
            <p className={styles.emptyText}>אין בקשות הצטרפות חדשות</p>
          </div>
        ) : (
          <div className={styles.requestsList}>
            {pendingRequests.map((request, index) => (
              <div key={index} className={styles.requestItem}>
                <div className={styles.requestHeader}>
                  <div className={styles.requestUserInfo}>
                    <h3 className={styles.requestUserName}>
                      {userProfiles[request.userId]?.name || 'משתמש'}
                    </h3>
                    {userProfiles[request.userId]?.phone && (
                      <p className={styles.requestUserPhone}>
                        📱 {userProfiles[request.userId].phone}
                      </p>
                    )}
                  </div>
                  <div className={styles.requestGameInfo}>
                    <p className={styles.requestGameDate}>📅 {request.date}</p>
                    <p className={styles.requestGameTime}>🕐 {request.time}</p>
                  </div>
                </div>

                <div className={styles.requestActions}>
                  <button
                    onClick={() => handleApprove(request.gameId, request.userId)}
                    className={styles.approveBtn}
                    disabled={actionLoading}
                  >
                    ✓ אשר
                  </button>
                  <button
                    onClick={() => handleReject(request.gameId, request.userId)}
                    className={styles.rejectBtn}
                    disabled={actionLoading}
                  >
                    ✗ דחה
                  </button>
                  <button
                    onClick={() => navigate(`/game/${request.gameId}`)}
                    className={styles.viewBtn}
                  >
                    👁️ צפה במשחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
