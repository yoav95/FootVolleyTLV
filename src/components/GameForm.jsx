import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { createGame, getUserActiveGame } from '../firebase/gameService';
import { getUserProfile } from '../firebase/authService';
import { compressImage } from '../utils/imageCompression';
import styles from './GameForm.module.css';

// Get current date and time in required formats
const getCurrentDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const getCurrentTime = () => {
  const now = new Date();
  // Round to next 30 minutes
  const minutes = now.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 0;
  if (roundedMinutes === 0) {
    now.setHours(now.getHours() + 1);
  }
  now.setMinutes(roundedMinutes);
  return now.toTimeString().slice(0, 5);
};

// Get today's date as YYYY-MM-DD string
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Format date for display
const formatDateDisplay = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  
  if (dateString === todayString) return 'היום';
  if (dateString === tomorrowString) return 'מחר';
  
  return selectedDate.toLocaleDateString('he-IL', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Format time for display
const formatTimeDisplay = (timeString) => {
  return timeString.slice(0, 5);
};

// Get color based on level
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

function GameForm({ location, onSuccess, onCancel }) {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    date: getCurrentDate(),
    time: getCurrentTime(),
    playersNeeded: 4,
    level: '4',
    notes: '',
    meetingPointText: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [checkingGame, setCheckingGame] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const fetchProfile = async () => {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      };
      fetchProfile();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const checkActiveGame = async () => {
        try {
          setCheckingGame(true);
          const game = await getUserActiveGame(currentUser.uid);
          setActiveGame(game);
        } catch (err) {
          console.error('Error checking active game:', err);
        } finally {
          setCheckingGame(false);
        }
      };
      checkActiveGame();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const adjustDate = (days) => {
    const [year, month, day] = formData.date.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + days);
    
    const newDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const today = getTodayString();
    
    // Only allow dates today or in the future
    if (newDate >= today) {
      setFormData(prev => ({ ...prev, date: newDate }));
    }
  };

  const adjustTime = (minutes) => {
    const [hours, mins] = formData.time.split(':').map(Number);
    let date = new Date();
    date.setHours(hours, mins + minutes);
    const newTime = date.toTimeString().slice(0, 5);
    
    // Only allow times that haven't passed yet (if today is selected)
    const today = getTodayString();
    if (formData.date === today) {
      const now = new Date();
      const [newHours, newMins] = newTime.split(':').map(Number);
      const selectedDateTime = new Date();
      selectedDateTime.setHours(newHours, newMins, 0);
      
      if (selectedDateTime >= now) {
        setFormData(prev => ({ ...prev, time: newTime }));
      }
    } else {
      setFormData(prev => ({ ...prev, time: newTime }));
    }
  };

  const canDecrementTime = () => {
    const [hours, mins] = formData.time.split(':').map(Number);
    const newHours = hours - 1;
    
    if (formData.date !== getTodayString()) return true;
    
    const now = new Date();
    const selectedDateTime = new Date();
    selectedDateTime.setHours(newHours, mins - 30);
    
    return selectedDateTime >= now;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setError('');
        // Compress image
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, image: compressedBase64 }));
        setImagePreview(compressedBase64);
      } catch (err) {
        setError(err.message);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('עליך להיות מחובר כדי ליצור משחק');
      return;
    }
    if (!location) {
      setError('בחר מיקום על המפה');
      return;
    }
    if (!userProfile?.phone) {
      setError('עליך להוסיף מספר טלפון לפני יצירת משחק. עדכן את הפרופיל שלך.');
      return;
    }
    if (activeGame) {
      setError('אתה כבר יצרת משחק. מחק אותו כדי ליצור משחק חדש.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const gameData = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        playersNeeded: formData.playersNeeded,
        level: formData.level,
        notes: formData.notes,
        meetingPointText: formData.meetingPointText,
        image: formData.image || null,
        coordinates: location,
        players: [currentUser.uid],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await createGame(gameData, currentUser.uid);
      setFormData({
        title: '',
        date: getCurrentDate(),
        time: getCurrentTime(),
        playersNeeded: 4,
        level: '4',
        notes: '',
        meetingPointText: '',
        image: null
      });
      setImagePreview(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {checkingGame ? (
        <div className={styles.loading}>בודק משחקים קיימים...</div>
      ) : !userProfile?.phone ? (
        <div className={styles.activeGameMessage}>
          <p>⚠️ נדרש מספר טלפון</p>
          <p>עליך להוסיף מספר טלפון לפרופיל שלך לפני יצירת משחק</p>
          <p>מספר הטלפון יאפשר לשחקנים אחרים ליצור איתך קשר</p>
          <button 
            type="button" 
            onClick={() => window.location.href = '/profile'} 
            className={styles.submitBtn}
            style={{marginTop: '1rem'}}
          >
            עדכן פרופיל
          </button>
        </div>
      ) : activeGame ? (
        <div className={styles.activeGameMessage}>
          <p>⚠️ אתה כבר יצרת משחק</p>
          <p className={styles.activeGameDate}>
            {activeGame.date} ב-{activeGame.time}
          </p>
          <p>מחק את המשחק הקיים כדי ליצור משחק חדש</p>
        </div>
      ) : (
        <>
      <div className={styles.formGroup}>
        <label htmlFor="title" className={styles.label}>⚽ כותרת המשחק *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className={styles.input}
          placeholder="לדוגמה: משחק חופים, משחק ערב, וכו'"
          disabled={loading}
          maxLength="50"
        />
      </div>

      <div className={styles.dateTimeContainer}>
        <div className={styles.formGroup}>
          <label className={styles.label}>📅 תאריך</label>
          <div className={styles.dateTimeControls}>
            <button type="button" onClick={() => adjustDate(-1)} className={styles.dateBtn} disabled={loading || formData.date === getTodayString()}>→</button>
            <div className={styles.dateDisplay}>{formatDateDisplay(formData.date)}</div>
            <button type="button" onClick={() => adjustDate(1)} className={styles.dateBtn} disabled={loading}>←</button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>🕐 שעה</label>
          <div className={styles.timeControls}>
            <button type="button" onClick={() => adjustTime(-30)} className={styles.timeBtn} disabled={loading || !canDecrementTime()}>−</button>
            <div className={styles.timeDisplay}>{formatTimeDisplay(formData.time)}</div>
            <button type="button" onClick={() => adjustTime(30)} className={styles.timeBtn} disabled={loading}>+</button>
          </div>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="playersNeeded" className={styles.label}>👥 מספר שחקנים דרוש *</label>
          <select
            id="playersNeeded"
            name="playersNeeded"
            value={formData.playersNeeded}
            onChange={handleChange}
            required
            className={styles.select}
            disabled={loading}
          >
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10">10</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>🏆 רמה *</label>
        <div className={styles.levelPickerContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, level: level.toString() }))}
              className={`${styles.levelButton} ${formData.level === level.toString() ? styles.levelButtonActive : ''}`}
              style={{
                backgroundColor: formData.level === level.toString() ? getLevelColor(level) : `${getLevelColor(level)}33`,
                borderColor: getLevelColor(level),
                color: formData.level === level.toString() ? '#fff' : '#666'
              }}
              disabled={loading}
            >
              <svg className={styles.levelFootballIcon} viewBox="0 0 24 24" fill="currentColor">
                <image href="/football.svg" x="0" y="0" width="24" height="24" />
              </svg>
              <span className={styles.levelNumber}>{level}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="meetingPointText" className={styles.label}>📍 תיאור נקודת המפגש</label>
        <input
          type="text"
          id="meetingPointText"
          name="meetingPointText"
          value={formData.meetingPointText}
          onChange={handleChange}
          className={styles.input}
          placeholder="למשל: 'ליד הרשתות כדורעף', 'ליד מגדל המציל'"
          disabled={loading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="notes" className={styles.label}>📝 הערות (אופציונלי)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="הוסף הערות נוספות על המשחק..."
          rows="3"
          disabled={loading}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>📸 תמונה של מקום המפגש (אופציונלי)</label>
        <div className={styles.imageUploadContainer}>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className={styles.fileInput}
            disabled={loading}
          />
          <label htmlFor="image" className={styles.fileInputLabel}>
            {imagePreview ? '✓ שנה תמונה' : '📤 העלה תמונה של המשחק'}
          </label>
          {imagePreview && (
            <div className={styles.imagePreviewContainer}>
              <img src={imagePreview} alt="תצוגה מקדימה" className={styles.imagePreview} />
              <button
                type="button"
                onClick={removeImage}
                className={styles.removeImageBtn}
                disabled={loading}
              >
                ✕ הסר תמונה
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonGroup}>
        <button 
          type="submit" 
          className={styles.submitBtn} 
          disabled={loading || !userProfile?.phone || activeGame || checkingGame}
          title={activeGame ? 'אתה כבר יצרת משחק' : !userProfile?.phone ? 'עליך להוסיף מספר טלפון לפני יצירת משחק' : ''}
        >
          {loading ? '⏳ יוצר משחק...' : '✓ יצור משחק'}
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={loading}>
          ✕ ביטול
        </button>
      </div>
        </>
      )}
    </form>
  );
}

export default GameForm;
