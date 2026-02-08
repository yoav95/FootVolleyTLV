import { useState } from 'react';
import { updateUserProfile } from '../firebase/authService';
import styles from './PhonePromptModal.module.css';

function PhonePromptModal({ userId, onClose }) {
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError('אנא הכנס מספר טלפון');
      return;
    }

    if (!nickname.trim()) {
      setError('אנא הכנס כינוי');
      return;
    }

    // Basic phone validation - at least 9 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setError('מספר טלפון חייב להיות לפחות 9 ספרות');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateUserProfile(userId, { 
        phone: phone.trim(),
        nickname: nickname.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת הנתונים');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping, but encourage adding later
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleSkip}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>👤 השלם את הפרופיל שלך</h2>
          <p className={styles.subtitle}>הנתונים הללו יאפשרו לשחקנים אחרים ליצור איתך קשר</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="nickname" className={styles.label}>כינוי *</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="לדוגמה: מיקי, אלוף כדורעף"
              className={styles.input}
              disabled={loading}
              autoFocus
              maxLength="30"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>מספר טלפון *</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              className={styles.input}
              disabled={loading}
              maxLength="20"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? '⏳ שומר...' : '✓ שמור נתונים'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className={styles.skipBtn}
              disabled={loading}
            >
              דלג
            </button>
          </div>
        </form>

        <p className={styles.note}>
          💡 אתה יכול להוסיף או לשנות את הנתונים בכל עת בעמוד הפרופיל שלך
        </p>
      </div>
    </div>
  );
}

export default PhonePromptModal;
