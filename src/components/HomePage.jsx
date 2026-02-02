import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvent, useMap, CircleMarker, Popup } from 'react-leaflet';
import { GiSoccerBall } from 'react-icons/gi';
import { getAllGames } from '../firebase/gameService';
import { AuthContext } from '../App';
import styles from './HomePage.module.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ setSelectedLocation, setShowDialog, setPopupPosition }) {
  const map = useMap();
  useMapEvent('click', (e) => {
    const newLocation = {
      lat: e.latlng.lat,
      lng: e.latlng.lng
    };
    setSelectedLocation(newLocation);
    // Convert lat/lng to pixel coordinates
    const point = map.latLngToContainerPoint([e.latlng.lat, e.latlng.lng]);
    setPopupPosition({
      x: point.x,
      y: point.y
    });
    setShowDialog(true);
  });
  return null;
}

// Function to get color based on level
function getLevelColor(level) {
  const levelMap = {
    'מתחילים': '#4ade80',
    'ביניים': '#fbbf24',
    'מתקדמים': '#ef4444',
    'לכל הרמות': '#8b5cf6',
    // English fallbacks
    'Beginner': '#4ade80',
    'Intermediate': '#fbbf24',
    'Advanced': '#ef4444',
    'All Levels': '#8b5cf6'
  };
  return levelMap[level] || '#00b4d8';
}

// Game Marker Component with soccer ball icon
function GameMarker({ game, navigate }) {
  const color = getLevelColor(game.level);
  const progressPercentage = (game.currentPlayers / game.playersNeeded) * 100;
  const isFull = game.currentPlayers >= game.playersNeeded;

  // Create a unique popup key to force updates
  const popupKey = `${game.id}-${game.currentPlayers}`;

  // Create custom icon with soccer ball
  const createSoccerBallIcon = (fillColor) => {
    const isFull = game.currentPlayers >= game.playersNeeded;
    const progressPercentage = (game.currentPlayers / game.playersNeeded) * 100;
    const dashArray = (progressPercentage / 100) * (2 * Math.PI * 20);
    
    const html = `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
        <svg style="position: absolute; width: 56px; height: 56px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" viewBox="0 0 56 56">
          <!-- Background circle -->
          <circle cx="28" cy="28" r="24" fill="white" stroke="white" stroke-width="2"/>
          <!-- Progress ring background -->
          <circle cx="28" cy="28" r="20" fill="none" stroke="rgba(0,180,216,0.2)" stroke-width="2.5"/>
          <!-- Progress ring (filled) -->
          <circle 
            cx="28" 
            cy="28" 
            r="20" 
            fill="none" 
            stroke="${isFull ? '#ff6b6b' : '#00b4d8'}" 
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-dasharray="${dashArray} ${2 * Math.PI * 20}"
            transform="rotate(-90 28 28)"
          />
          <!-- Colored soccer ball circle -->
          <circle cx="28" cy="28" r="16" fill="${isFull ? '#9ca3af' : fillColor}" stroke="white" stroke-width="1.5"/>
          <!-- Soccer ball pentagon pattern -->
          <g fill="white" opacity="0.7">
            <circle cx="28" cy="28" r="3"/>
            <circle cx="28" cy="17" r="2"/>
            <circle cx="36" cy="22" r="2"/>
            <circle cx="36" cy="34" r="2"/>
            <circle cx="28" cy="39" r="2"/>
            <circle cx="20" cy="34" r="2"/>
            <circle cx="20" cy="22" r="2"/>
          </g>
        </svg>
      </div>
    `;
    
    return L.divIcon({
      html: html,
      iconSize: [56, 56],
      iconAnchor: [28, 28],
      popupAnchor: [0, -28],
      className: 'custom-soccer-icon'
    });
  };

  return (
    <Marker
      key={popupKey}
      position={[game.coordinates.lat, game.coordinates.lng]}
      icon={createSoccerBallIcon(color)}
      eventHandlers={{
        click: (e) => {
          e.target.openPopup();
        }
      }}
    >
      <Popup className={styles.customPopup}>
        <div className={styles.popupContentWrapper} onClick={() => navigate(`/game/${game.id}`)}>
          <div className={styles.popupHeader}>
            <span className={styles.popupOrganizer}>משחק של {game.organizer}</span>
            <span className={styles.popupLevel} style={{ backgroundColor: color }}>{game.level}</span>
          </div>
          <div className={styles.popupDetails}>
              <div className={styles.popupDetailItem}>
                <span className={styles.popupIcon}>📅</span>
                <span>{game.date}</span>
              </div>
              <div className={styles.popupDetailItem}>
                <span className={styles.popupIcon}>🕐</span>
                <span>{game.time}</span>
              </div>
              <div className={styles.popupDetailItem}>
                <span className={styles.popupIcon}>👥</span>
                <span>{game.currentPlayers}/{game.playersNeeded} שחקנים</span>
              </div>
            </div>
            <div className={styles.popupFooter}>
              <span className={styles.popupCta}>לחץ לפרטים מלאים ←</span>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }

function HomePage() {
  const [gamesList, setGamesList] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoadingGames(true);
        const allGames = await getAllGames();
        setGamesList(allGames);
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoadingGames(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const { getUserProfile } = await import('../firebase/authService');
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUserProfile({
            name: currentUser.displayName || 'משתמש',
            level: 2
          });
        }
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import('../firebase/authService');
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleProfileClick = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };

  const handleCreateGame = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (selectedLocation) {
      navigate(`/create-game?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`);
    }
  };

  // Create GeoJSON from games
  const geoJsonData = {
    type: 'FeatureCollection',
    features: gamesList.map((game) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [game.coordinates?.lng || 34.7692, game.coordinates?.lat || 32.0853]
      },
      properties: {
        id: game.id,
        organizer: game.organizer,
        date: game.date,
        time: game.time,
        level: game.level,
        playersNeeded: game.playersNeeded,
        currentPlayers: game.currentPlayers
      }
    }))
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const popupContent = L.popup()
      .setContent(`
        <div style="cursor: pointer;">
          <strong>משחק של ${props.organizer}</strong><br/>
          תאריך: ${props.date}<br/>
          שעה: ${props.time}<br/>
          רמה: ${props.level}<br/>
          שחקנים: ${props.currentPlayers}/${props.playersNeeded}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc;">
            <small style="color: #666;">לחץ כדי לראות פרטים</small>
          </div>
        </div>
      `);
    
    layer.bindPopup(popupContent);
    layer.on('click', () => {
      layer.openPopup();
    });
    layer.on('popupopen', () => {
      const popup = layer.getPopup();
      const popupElement = popup.getElement();
      if (popupElement) {
        popupElement.style.cursor = 'pointer';
        popupElement.addEventListener('click', () => {
          navigate(`/game/${props.id}`);
        });
      }
    });
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setShowDialog(false);
  };

  // Get upcoming games count (games with future dates)
  const upcomingGamesCount = gamesList.length;

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h2 className={styles.navTitle}>FootVolley TLV</h2>
        <div className={styles.navButtons}>
          {currentUser ? (
            <>
              <button className={styles.navBtn} title="פרופיל משתמש" onClick={handleProfileClick}>
                <span className={styles.navIcon}>👤</span>
                {userProfile?.name || currentUser.displayName || 'משתמש'} (רמה {userProfile?.level || 2})
              </button>
              <button className={styles.navBtn} title="התנתקות" onClick={handleLogout}>
                <span className={styles.navIcon}>🚪</span>
                התנתקות
              </button>
            </>
          ) : (
            <button className={styles.navBtn} title="התחברות" onClick={() => navigate('/login')}>
              <span className={styles.navIcon}>🔑</span>
              התחברות
            </button>
          )}
        </div>
      </nav>

      {/* <header className={styles.header}>
        <h1 className={styles.title}>FootVolley TLV</h1>
        <p className={styles.subtitle}>Click on the map to select a location</p>
      </header> */}

      <div className={styles.mapContainer}>
        <MapContainer 
          center={[32.0853, 34.7692]} 
          zoom={13} 
          minZoom={13}
          maxZoom={19}
          style={{ height: '100%', width: '100%' }}
          maxBounds={[[32.02, 34.74], [32.15, 34.81]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {!loadingGames && gamesList.length > 0 && gamesList.map((game) => (
            <GameMarker key={game.id} game={game} navigate={navigate} />
          ))}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            />
          )}
          <MapClickHandler 
            setSelectedLocation={setSelectedLocation} 
            setShowDialog={setShowDialog}
            setPopupPosition={setPopupPosition}
          />
        </MapContainer>

        {selectedLocation && showDialog && (
          <div 
            className={styles.overlayPopup}
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y}px`
            }}
          >
            <div className={styles.popupContent}>
              <h3>ליצור משחק חדש?</h3>
              <div className={styles.popupActions}>
                <button onClick={handleCreateGame} className={styles.popupConfirmBtn}>
                  ✓ יצירה
                </button>
                <button onClick={handleCancel} className={styles.popupCancelBtn}>
                  ✗ ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.infoBar}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>🎮</span>
          <div className={styles.infoContent}>
            <p className={styles.infoLabel}>משחקים קרובים</p>
            <p className={styles.infoValue}>{upcomingGamesCount} משחקים</p>
          </div>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>🌤️</span>
          <div className={styles.infoContent}>
            <p className={styles.infoLabel}>מזג אוויר</p>
            <p className={styles.infoValue}>28°C, שמש</p>
          </div>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>📍</span>
          <div className={styles.infoContent}>
            <p className={styles.infoLabel}>מיקום</p>
            <p className={styles.infoValue}>חוף תל אביב</p>
          </div>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>👥</span>
          <div className={styles.infoContent}>
            <p className={styles.infoLabel}>שחקנים פעילים</p>
            <p className={styles.infoValue}>{gamesList.reduce((sum, g) => sum + (g.players?.length || 0), 0)} שחקנים</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
