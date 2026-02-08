import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, logoutUser } from '../firebase/authService';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: '2',
    phone: '',
    nickname: ''
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
            level: userProfile.level?.toString() || '2',
            phone: userProfile.phone || '',
            nickname: userProfile.nickname || ''
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
    if (!formData.phone.trim()) {
      setError('מספר טלפון לא יכול להיות ריק');
      return;
    }
    if (!formData.nickname.trim()) {
      setError('כינוי לא יכול להיות ריק');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateUserProfile(currentUser.uid, {
        name: formData.name,
        level: parseInt(formData.level),
        phone: formData.phone,
        nickname: formData.nickname
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
      level: profile?.level?.toString() || '2',
      phone: profile?.phone || '',
      nickname: profile?.nickname || ''
    });
    setEditMode(false);
    setError('');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch {
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
                  <option value="1">רמה 1</option>
                  <option value="2">רמה 2</option>
                  <option value="3">רמה 3</option>
                  <option value="4">רמה 4</option>
                  <option value="5">רמה 5</option>
                  <option value="6">רמה 6</option>
                  <option value="7">רמה 7</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="nickname" className={styles.label}>כינוי *</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="לדוגמה: מיקי, אלוף כדורעף"
                  disabled={saving}
                  maxLength="30"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>מספר טלפון *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="050-1234567"
                  disabled={saving}
                />
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
                    רמה {profile?.level || 4}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>כינוי:</span>
                  <span className={styles.infoValue}>{profile?.nickname || 'לא הוגדר'}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>טלפון:</span>
                  <span className={styles.infoValue}>{profile?.phone || 'לא הוגדר'}</span>
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
