import { useState, useEffect, useContext, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvent, useMap, CircleMarker, Popup } from 'react-leaflet';
import { GiSoccerBall } from 'react-icons/gi';
import { getAllGames } from '../firebase/gameService';
import { AuthContext } from '../contexts/AuthContext';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import styles from './HomePage.module.css';
import geoJsonPolygons from '../data/geojsonPolygons.json';
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
  // Handle numeric levels (1-7) with pink to blue gradient
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
  
  // Return color for numeric level, or default to middle purple-blue
  return colorMap[numericLevel] || '#a78bfa';
}

// Component to add labels to GeoJSON features
const GeoJSONWithLabels = memo(function GeoJSONWithLabels({ data }) {
  const onEachFeature = useCallback((feature, layer) => {
    const { name, nets } = feature.properties;
    
    // Create simple popup
    const popupContent = `
      <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
        <div style="font-weight: bold; font-size: 13px; color: #00b4d8; margin-bottom: 4px;">
          ${name}
        </div>
        <div style="font-size: 12px; color: #666;">
          🥅 רשתות: ${nets}
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);
    
    // Add hover effects
    layer.on('mouseover', function() {
      this.setStyle({ 
        weight: 3, 
        opacity: 0.8,
        fillOpacity: 0.12,
        color: '#0096c7'
      });
      this.bringToFront();
    });
    layer.on('mouseout', function() {
      this.setStyle({ 
        weight: 2, 
        opacity: 0.6,
        fillOpacity: 0.08,
        color: '#00b4d8'
      });
    });
  }, []);

  const geoJsonStyle = useMemo(() => ({
    color: '#00b4d8',
    weight: 2,
    opacity: 0.6,
    fillOpacity: 0.08,
    fillColor: '#00b4d8'
  }), []);

  return (
    <GeoJSON 
      data={data}
      style={geoJsonStyle}
      onEachFeature={onEachFeature}
    />
  );
});

const GameMarker = memo(function GameMarker({ game, navigate, hasPendingRequests = false }) {
  const color = useMemo(() => getLevelColor(game.level), [game.level]);

  // Create custom icon with soccer ball
  const icon = useMemo(() => {
    const isFull = game.currentPlayers >= game.playersNeeded;
    const progressPercentage = (game.currentPlayers / game.playersNeeded) * 100;
    const dashArray = (progressPercentage / 100) * (2 * Math.PI * 20);
    
    const html = `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <svg style="position: absolute; width: 56px; height: 56px;" viewBox="0 0 56 56">
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
          <!-- Colored circle background for football -->
          <circle cx="28" cy="28" r="16" fill="${isFull ? '#e5e7eb' : color}" stroke="${isFull ? '#9ca3af' : color}" stroke-width="1.5" opacity="0.9"/>
          
          <!-- Football icon from SVG file -->
          <image href="/football.svg" x="14" y="14" width="28" height="28" opacity="${isFull ? '0.4' : '1'}"/>
          
          <!-- Red badge for pending requests -->
          ${hasPendingRequests ? `<circle cx="46" cy="10" r="7" fill="#ef4444" stroke="white" stroke-width="1.5"/>` : ''}
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
  }, [color, game.currentPlayers, game.playersNeeded, hasPendingRequests]);

  const handleClick = useCallback((e) => {
    e.target.openPopup();
  }, []);

  const handlePopupClick = useCallback(() => {
    navigate(`/game/${game.id}`);
  }, [navigate, game.id]);

  return (
    <Marker
      position={[game.coordinates.lat, game.coordinates.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick
      }}
    >
      <Popup className={styles.customPopup}>
        <div className={styles.popupContentWrapper} onClick={handlePopupClick}>
          <div className={styles.popupHeader}>
            <span className={styles.popupOrganizer}>{game.title || 'משחק'}</span>
            <span className={styles.popupLevel} style={{ backgroundColor: color }}>רמה {game.level}</span>
          </div>
          <div className={styles.popupDetails}>
              <div className={styles.popupDetailItem}>
                <span className={styles.popupIcon}>👤</span>
                <span>מארגן: {game.organizer}</span>
              </div>
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
  });

function HomePage({ pendingRequests: initialPendingRequests = [] }) {
  const [gamesList, setGamesList] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const { toast, hideToast, showError } = useToast();
  const [weather, setWeather] = useState({
    temp: '--',
    description: '--',
    icon: '🌤️',
    loading: true
  });
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoadingGames(true);
        const allGames = await getAllGames();
        
        // Fetch organizer names for all games
        const { getUserProfile } = await import('../firebase/authService');
        const gamesWithOrganizers = await Promise.all(
          allGames.map(async (game) => {
            try {
              const organizerProfile = await getUserProfile(game.organizerId);
              return {
                ...game,
                organizer: organizerProfile?.nickname || organizerProfile?.name || 'מארגן'
              };
            } catch (err) {
              console.error(`Error fetching organizer for game ${game.id}:`, err);
              return {
                ...game,
                organizer: 'מארגן'
              };
            }
          })
        );
        
        setGamesList(gamesWithOrganizers);
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

  // Fetch weather for Tel Aviv
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Tel Aviv coordinates
        const lat = 32.0853;
        const lon = 34.7818;
        
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m&temperature_unit=celsius&timezone=auto`
        );
        const data = await response.json();
        
        if (data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          
          // Map WMO weather codes to icons and descriptions
          const getWeatherInfo = (code) => {
            if (code === 0 || code === 1) return { icon: '☀️', desc: 'שמש' };
            if (code === 2 || code === 3) return { icon: '⛅', desc: 'עננים חלקיים' };
            if (code === 45 || code === 48) return { icon: '🌫️', desc: 'ערפל' };
            if (code === 51 || code === 53 || code === 55) return { icon: '🌧️', desc: 'גשם קל' };
            if (code === 61 || code === 63 || code === 65) return { icon: '⛈️', desc: 'גשם' };
            if (code === 71 || code === 73 || code === 75) return { icon: '❄️', desc: 'שלג' };
            if (code === 77) return { icon: '❄️', desc: 'כדורי שלג' };
            if (code === 80 || code === 81 || code === 82) return { icon: '🌧️', desc: 'זלפות' };
            if (code === 85 || code === 86) return { icon: '❄️', desc: 'שלג' };
            if (code === 95 || code === 96 || code === 99) return { icon: '⛈️', desc: 'רעם וברק' };
            return { icon: '🌤️', desc: 'חדות' };
          };
          
          const weatherInfo = getWeatherInfo(code);
          setWeather({
            temp: `${temp}°C`,
            description: weatherInfo.desc,
            icon: weatherInfo.icon,
            loading: false
          });
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
        setWeather(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchWeather();
    // Update weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const { logoutUser } = await import('../firebase/authService');
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      showError('שגיאה בהתנתקות');
    }
  }, [navigate, showError]);

  const handleProfileClick = useCallback(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleCreateGame = useCallback(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (selectedLocation) {
      navigate(`/create-game?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`);
    }
  }, [currentUser, selectedLocation, navigate]);

  const handleCancel = useCallback(() => {
    setSelectedLocation(null);
    setShowDialog(false);
  }, []);

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h2 className={styles.navTitle}>FootVolley TLV</h2>
        <div className={styles.navButtons}>
          {currentUser ? (
            <>
              {initialPendingRequests.length > 0 && (
                <button 
                  className={styles.notificationBtn} 
                  onClick={() => navigate(`/notifications`)}
                  title={`${initialPendingRequests.length} בקשות ממתינות`}
                >
                  <span className={styles.notificationIcon}>🔔</span>
                  <span className={styles.notificationBadge}>{initialPendingRequests.length}</span>
                </button>
              )}
              <button className={styles.navBtn} title="פרופיל משתמש" onClick={handleProfileClick}>
                <span className={styles.navIcon}>👤</span>
                {userProfile?.nickname || userProfile?.name || currentUser.displayName || 'משתמש'} (רמה {userProfile?.level || 2})
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
          <GeoJSONWithLabels data={geoJsonPolygons} />
          {!loadingGames && gamesList.length > 0 && gamesList.map((game) => (
            <GameMarker 
              key={game.id} 
              game={game} 
              navigate={navigate}
              hasPendingRequests={initialPendingRequests.some(req => req.gameId === game.id)}
            />
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
            className={styles.dialogOverlay}
            onClick={handleCancel}
          >
            <div 
              className={styles.overlayPopup}
              onClick={(e) => e.stopPropagation()}
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
          </div>
        )}

        {/* Weather Widget - Bottom Right */}
        <div className={styles.weatherWidget}>
          <span className={styles.weatherIcon}>{weather.icon}</span>
          <div className={styles.weatherInfo}>
            <p className={styles.weatherTemp}>{weather.temp}</p>
            <p className={styles.weatherDesc}>{weather.description}</p>
          </div>
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

export default HomePage;
