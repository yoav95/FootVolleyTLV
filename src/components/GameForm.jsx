import { useState } from 'react';
import styles from './GameForm.module.css';

function GameForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    organizer: '',
    playersNeeded: 4,
    level: 'Intermediate',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      notes: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="date" className={styles.label}>Date *</label>
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
          <label htmlFor="time" className={styles.label}>Time *</label>
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
        <label htmlFor="organizer" className={styles.label}>Your Name *</label>
        <input
          type="text"
          id="organizer"
          name="organizer"
          value={formData.organizer}
          onChange={handleChange}
          required
          className={styles.input}
          placeholder="Enter your name"
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="playersNeeded" className={styles.label}>Players Needed *</label>
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
          <label htmlFor="level" className={styles.label}>Level *</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="notes" className={styles.label}>Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="Any additional information..."
          rows="3"
        />
      </div>

      <div className={styles.buttons}>
        <button type="submit" className={styles.submitBtn}>
          Create Game
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default GameForm;
