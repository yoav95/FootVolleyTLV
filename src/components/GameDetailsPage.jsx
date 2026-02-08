import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { getGameById, requestToJoinGame, leaveGame, approveJoinRequest, rejectJoinRequest, deleteGame, addCommentToGame, deleteCommentFromGame } from '../firebase/gameService';
import { getUserProfile } from '../firebase/authService';
import { AuthContext } from '../contexts/AuthContext';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import styles from './GameDetailsPage.module.css';

// Function to get color based on level
function getLevelColor(level) {
  const numericLevel = parseInt(level);
  const colorMap = {
    1: '#ec4899',  // Pink
    2: '#e879f9',  // Pink-Purple
    3: '#c084fc',  // Purple
    4: '#a78bfa',  // Purple-Blue (Middle)
    5: '#818cf8',  // Blue-Purple
    6: '#60a5fa',  // Light Blue
    7: '#3b82f6'   // Deep Blue
  };
  return colorMap[numericLevel] || '#a78bfa';
}

function GameDetailsPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { toast, hideToast, showSuccess, showError } = useToast();
  const [game, setGame] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [address, setAddress] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [organizerProfile, setOrganizerProfile] = useState(null);

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

  // Fetch user profiles for players and pending requests
  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (!game) return;

      const allUserIds = [
        ...(game.players || []),
        ...(game.pendingRequests || [])
      ];

      const profiles = {};
      for (const userId of allUserIds) {
        try {
          const profile = await getUserProfile(userId);
          profiles[userId] = profile;
        } catch (err) {
          console.error(`Error fetching profile for ${userId}:`, err);
        }
      }
      setUserProfiles(profiles);

      // Fetch organizer profile
      if (game.organizerId) {
        try {
          const orgProfile = await getUserProfile(game.organizerId);
          setOrganizerProfile(orgProfile);
        } catch (err) {
          console.error('Error fetching organizer profile:', err);
        }
      }
    };

    fetchUserProfiles();
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
      await requestToJoinGame(gameId, currentUser.uid);
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
      showSuccess('עזבת את המשחק בהצלחה');
    } catch (err) {
      setError(err.message);
      showError('שגיאה בעזיבת המשחק');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (userId) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      await approveJoinRequest(gameId, userId, currentUser.uid);
      const updatedGame = await getGameById(gameId);
      setGame(updatedGame);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (userId) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      await rejectJoinRequest(gameId, userId, currentUser.uid);
      const updatedGame = await getGameById(gameId);
      setGame(updatedGame);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!currentUser || !window.confirm('האם אתה בטוח שברצונך למחוק את המשחק?')) return;

    setActionLoading(true);
    try {
      await deleteGame(gameId, currentUser.uid);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) {
      setError('הערה לא יכולה להיות ריקה');
      return;
    }

    setCommentLoading(true);
    try {
      const userName = userProfiles[currentUser.uid]?.nickname || userProfiles[currentUser.uid]?.name || currentUser.displayName || 'משתמש';
      await addCommentToGame(gameId, currentUser.uid, userName, commentText);
      const updatedGame = await getGameById(gameId);
      setGame(updatedGame);
      setCommentText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;

    setCommentLoading(true);
    try {
      await deleteCommentFromGame(gameId, commentId, currentUser.uid);
      const updatedGame = await getGameById(gameId);
      setGame(updatedGame);
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const isUserInGame = currentUser && game.players && game.players.includes(currentUser.uid);
  const isFull = game.players && game.players.length >= game.playersNeeded;
  const isOrganizer = currentUser && game.organizerId === currentUser.uid;
  const hasPendingRequest = currentUser && game.pendingRequests && game.pendingRequests.includes(currentUser.uid);
  const canViewFullDetails = isOrganizer || isUserInGame;

  // Get the level color for background
  const levelColor = getLevelColor(game.level);

  return (
    <div className={styles.container} style={{
      background: `linear-gradient(135deg, ${levelColor}15 0%, ${levelColor}25 50%, ${levelColor}35 100%)`
    }}>
      <Link to="/" className={styles.backLink}>← חזרה למפה</Link>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.gameCard} style={{
        background: `linear-gradient(135deg, #ffffff 0%, ${levelColor}10 100%)`,
        borderColor: levelColor
      }}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {game.title || `משחק של ${organizerProfile?.nickname || organizerProfile?.name || 'מארגן'}`}
          </h1>
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
              {canViewFullDetails && game.players && game.players.length > 0 && (
                <div className={styles.playersList}>
                  <h4 className={styles.playersListTitle}>רשימת השחקנים:</h4>
                  <ul className={styles.playerListItems}>
                    {game.players.map((playerId, index) => (
                      <li key={index} className={styles.playerItem}>
                        <span className={styles.playerNumber}>{index + 1}.</span>
                        <div className={styles.playerInfo}>
                          <span className={styles.playerName}>
                            {userProfiles[playerId]?.nickname || userProfiles[playerId]?.name || 'שחקן'}
                          </span>
                          {userProfiles[playerId]?.phone && (
                            <span className={styles.playerPhone}>📱 {userProfiles[playerId].phone}</span>
                          )}
                        </div>
                        {playerId === game.organizerId && (
                          <span className={styles.organizerBadge}>🔸 מארגן</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests Section - Only visible to organizer */}
          {canViewFullDetails && isOrganizer && game.pendingRequests && game.pendingRequests.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>⏳ בקשות ממתינות ({game.pendingRequests.length})</h3>
              <div className={styles.pendingList}>
                {game.pendingRequests.map((userId, index) => (
                  <div key={index} className={styles.pendingItem}>
                    <span className={styles.pendingName}>
                      {userProfiles[userId]?.name || 'שחקן'}
                    </span>
                    <div className={styles.pendingActions}>
                      <button
                        onClick={() => handleApproveRequest(userId)}
                        className={styles.approveBtn}
                        disabled={actionLoading || isFull}
                      >
                        ✓ אשר
                      </button>
                      <button
                        onClick={() => handleRejectRequest(userId)}
                        className={styles.rejectBtn}
                        disabled={actionLoading}
                      >
                        ✗ דחה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {canViewFullDetails && game.notes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📝 הערות</h3>
              <p className={styles.detail}>{game.notes}</p>
            </div>
          )}

          {/* Comments Section - Only visible to participants and organizer */}
          {canViewFullDetails && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>💬 הודעות ({(game.comments || []).length})</h3>
            
            {/* Add Comment Form */}
            {currentUser && (
              <form onSubmit={handleAddComment} className={styles.commentForm}>
                <label className={styles.commentLabel}>הוסף הערה למשחק:</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="שתף את המחשבות שלך, שאל שאלות או תן עדכונים..."
                  className={styles.commentInput}
                  rows="4"
                  disabled={commentLoading}
                  dir="rtl"
                />
                <button
                  type="submit"
                  className={styles.submitCommentBtn}
                  disabled={commentLoading || !commentText.trim()}
                >
                  {commentLoading ? '📤 שולח...' : '📤 פרסם הערה'}
                </button>
              </form>
            )}

            {!currentUser && (
              <div className={styles.loginPrompt}>
                <p>עליך להתחבר כדי להוסיף הערה</p>
                <button onClick={() => navigate('/login')} className={styles.loginBtn}>
                  התחברות
                </button>
              </div>
            )}

            {!isUserInGame && currentUser && (
              <div className={styles.loginPrompt}>
                <p>הצטרף למשחק כדי להוסיף הערות</p>
              </div>
            )}

            {/* Comments List */}
            <div className={styles.commentsList}>
              {game.comments && game.comments.length > 0 ? (
                game.comments.map((comment) => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <div className={styles.commentAuthorSection}>
                          <span className={styles.commentAvatar}>👤</span>
                          <span className={styles.commentName}>{comment.userName}</span>
                        </div>
                        <span className={styles.commentTime}>
                          {new Date(comment.createdAt?.toDate?.() || comment.createdAt).toLocaleDateString('he-IL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className={styles.commentText} dir="rtl">{comment.text}</p>
                    </div>
                    {(currentUser?.uid === comment.userId || isOrganizer) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className={styles.deleteCommentBtn}
                        disabled={commentLoading}
                      >
                        🗑️ מחק
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.noComments}>💭 אין הערות עדיין. היה הראשון להוסיף הערה!</p>
              )}
            </div>
          </div>
          )}
        </div>

        <div className={styles.actions}>
          {hasPendingRequest ? (
            <button className={styles.pendingBtn} disabled>
              ⏳ בקשה ממתינה לאישור המארגן
            </button>
          ) : !isUserInGame && !isFull ? (
            <button onClick={handleJoinGame} className={styles.joinBtn} disabled={actionLoading}>
              {actionLoading ? 'שולח בקשה...' : '📩 בקש להצטרף למשחק'}
            </button>
          ) : isUserInGame && !isOrganizer && !isFull ? (
            <button onClick={handleLeaveGame} className={styles.leaveBtn} disabled={actionLoading}>
              {actionLoading ? 'עוזב...' : 'עזיבה מהמשחק'}
            </button>
          ) : isUserInGame && isOrganizer ? (
            <button className={styles.organizerBtn} disabled title="המארגן לא יכול לעזוב את המשחק">
              🔐 אתה המארגן - לא ניתן לעזוב
            </button>
          ) : isFull && !isUserInGame ? (
            <button className={styles.fullBtn} disabled>
              המשחק מלא
            </button>
          ) : null}
          {isOrganizer && (
            <button onClick={handleDeleteGame} className={styles.deleteBtn} disabled={actionLoading}>
              {actionLoading ? 'מוחק...' : '🗑️ מחק משחק'}
            </button>
          )}
          <button onClick={() => navigate('/')} className={styles.cancelBtn} disabled={actionLoading}>
            חזרה
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
}

export default GameDetailsPage;
