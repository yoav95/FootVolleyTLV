import { useState } from 'react';
import styles from './GameForm.module.css';

function GameForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    organizer: '',
    playersNeeded: 4,
    level: 'Intermediate',
    notes: '',
    meetingPointImage: null,
    meetingPointText: ''
  });

  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          meetingPointImage: reader.result
        }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      date: '',
      time: '',
      organizer: '',
      playersNeeded: 4,
      level: 'Intermediate',
      notes: '',
      meetingPointImage: null,
      meetingPointText: ''
    });
    setImagePreview(null);
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
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="organizer" className={styles.label}>שמך *</label>
        <input
          type="text"
          id="organizer"
          name="organizer"
          value={formData.organizer}
          onChange={handleChange}
          required
          className={styles.input}
          placeholder="הכנס את שמך"
        />
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
          >
            <option value="Beginner">מתחילים</option>
            <option value="Intermediate">ביניים</option>
            <option value="Advanced">מתקדמים</option>
            <option value="All Levels">לכל הרמות</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="notes" className={styles.label}>הערות</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="כל מידע נוסף..."
          rows="3"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>תמונת נקודת המפגש</label>
        <label htmlFor="meetingPointImage" className={styles.fileInputLabel}>
          📸 בחר תמונה
        </label>
        <input
          type="file"
          id="meetingPointImage"
          name="meetingPointImage"
          accept="image/*"
          onChange={handleImageChange}
          className={styles.fileInput}
        />
        {imagePreview && (
          <img src={imagePreview} alt="תצוגה מקדימה" className={styles.imagePreview} />
        )}
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
        />
      </div>

      <div className={styles.buttons}>
        <button type="submit" className={styles.submitBtn}>
          יצירת משחק
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          ביטול
        </button>
      </div>
    </form>
  );
}

export default GameForm;
