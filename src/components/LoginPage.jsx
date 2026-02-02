import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase/authService';
import styles from './LoginPage.module.css';

function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>FootVolley TLV</h1>
          <p className={styles.subtitle}>כניסה לחשבון</p>
        </header>

        <div className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? 'בעיבוד...' : '🔐 התחברות עם Google'}
          </button>

          <div className={styles.demoInfo}>
            <p className={styles.demoText}>
              התחבר עם חשבון Google שלך כדי להתחיל! 🌴
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
