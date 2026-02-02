import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { getUserProfile, updateUserProfile, logoutUser } from '../firebase/authService';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: '2'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await getUserProfile(currentUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            name: userProfile.name || '',
            level: userProfile.level?.toString() || '2'
          });
        }
      } catch (err) {
        setError('שגיאה בטעינת הפרופיל');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('שם לא יכול להיות ריק');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateUserProfile(currentUser.uid, {
        name: formData.name,
        level: parseInt(formData.level)
      });
      setProfile({
        ...profile,
        name: formData.name,
        level: parseInt(formData.level)
      });
      setEditMode(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('שגיאה בשמירת הנתונים');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      level: profile?.level?.toString() || '2'
    });
    setEditMode(false);
    setError('');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError('שגיאה בהתנתקות');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← חזרה למפה</Link>

      <div className={styles.profileCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>הפרופיל שלי</h1>
          <p className={styles.email}>{currentUser?.email}</p>
        </header>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>הנתונים נשמרו בהצלחה! ✅</div>}

        <div className={styles.content}>
          {editMode ? (
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>שם מלא *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="הכנס את שמך"
                  disabled={saving}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="level" className={styles.label}>רמת כישרון *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className={styles.select}
                  disabled={saving}
                >
                  <option value="1">מתחיל</option>
                  <option value="2">בינוני</option>
                  <option value="3">מתקדם</option>
                  <option value="4">מתקדם מאוד</option>
                  <option value="5">מומחה</option>
                </select>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelBtn}
                  disabled={saving}
                >
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.profileInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>שם:</span>
                  <span className={styles.infoValue}>{profile?.name || 'לא הוגדר'}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>דוא"ל:</span>
                  <span className={styles.infoValue}>{currentUser?.email}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>רמה:</span>
                  <span className={styles.infoValue}>
                    {(() => {
                      const levelMap = { 1: 'מתחיל', 2: 'בינוני', 3: 'מתקדם', 4: 'מתקדם מאוד', 5: 'מומחה' };
                      return levelMap[profile?.level] || 'בינוני';
                    })()}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>חבר מאז:</span>
                  <span className={styles.infoValue}>
                    {profile?.createdAt ? new Date(profile.createdAt.toDate?.() || profile.createdAt).toLocaleDateString('he-IL') : 'ללא מידע'}
                  </span>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={() => setEditMode(true)}
                  className={styles.editBtn}
                >
                  עריכת פרופיל
                </button>
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            התנתקות
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProfilePage;
