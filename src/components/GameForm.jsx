import { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { createGame } from '../firebase/gameService';
import styles from './GameForm.module.css';

function GameForm({ location, onSuccess, onCancel }) {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    playersNeeded: 4,
    level: '2',
    notes: '',
    meetingPointText: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    setError('');
    setLoading(true);

    try {
      const gameData = {
        ...formData,
        coordinates: location,
        players: [currentUser.uid],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await createGame(gameData, currentUser.uid);
      setFormData({
        date: '',
        time: '',
        playersNeeded: 4,
        level: '2',
        notes: '',
        meetingPointText: ''
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="date" className={styles.label}>תאריך *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className={styles.input}
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="time" className={styles.label}>שעה *</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            className={styles.input}
            disabled={loading}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="playersNeeded" className={styles.label}>מספר שחקנים דרוש *</label>
          <select
            id="playersNeeded"
            name="playersNeeded"
            value={formData.playersNeeded}
            onChange={handleChange}
            required
            className={styles.select}
            disabled={loading}
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10">10</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="level" className={styles.label}>רמה *</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
            required
            className={styles.select}
            disabled={loading}
          >
            <option value="1">מתחיל</option>
            <option value="2">בינוני</option>
            <option value="3">מתקדם</option>
            <option value="4">מתקדם מאוד</option>
            <option value="5">מומחה</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="meetingPointText" className={styles.label}>תיאור נקודת המפגש</label>
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
        <label htmlFor="notes" className={styles.label}>הערות (אופציונלי)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="הוסף הערות נוספות"
          rows="3"
          disabled={loading}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'יוצר משחק...' : 'יצור משחק'}
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={loading}>
          ביטול
        </button>
      </div>
    </form>
  );
}

export default GameForm;
