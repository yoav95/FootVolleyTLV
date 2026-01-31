import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvent, useMap, CircleMarker, Popup } from 'react-leaflet';
import { games } from '../data/mockData';
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
    'Beginner': '#4ade80',
    'Intermediate': '#fbbf24',
    'Advanced': '#ef4444',
    'All Levels': '#8b5cf6'
  };
  return levelMap[level] || '#646cff';
}

// Game Marker Component with circular progress
function GameMarker({ game, navigate }) {
  const color = getLevelColor(game.level);
  const progressPercentage = (game.currentPlayers / game.playersNeeded) * 100;
  const isFull = game.currentPlayers >= game.playersNeeded;

  // Create a unique popup key to force updates
  const popupKey = `${game.id}-${game.currentPlayers}`;

  return (
    <>
      {/* Progress ring background (empty ring) */}
      <CircleMarker
        center={[game.coordinates.lat, game.coordinates.lng]}
        radius={16}
        fillColor="transparent"
        color="#ffffff"
        weight={4}
        opacity={0.8}
        fillOpacity={0}
        interactive={false}
      />
      {/* Progress ring (filled portion) */}
      <CircleMarker
        center={[game.coordinates.lat, game.coordinates.lng]}
        radius={16}
        fillColor="transparent"
        color="#646cff"
        weight={5}
        opacity={1}
        fillOpacity={0}
        interactive={false}
        dashArray={`${(progressPercentage / 100) * (2 * Math.PI * 16)} ${2 * Math.PI * 16}`}
      />
      {/* Main dot marker */}
      <CircleMarker
        key={popupKey}
        center={[game.coordinates.lat, game.coordinates.lng]}
        radius={10}
        fillColor={color}
        color={color}
        weight={2}
        opacity={1}
        fillOpacity={0.9}
        eventHandlers={{
          click: (e) => {
            e.target.openPopup();
          }
        }}
      >
        <Popup>
          <div style={{ cursor: 'pointer', minWidth: '200px' }} onClick={() => navigate(`/game/${game.id}`)}>
            <strong>משחק של {game.organizer}</strong><br/>
            תאריך: {game.date}<br/>
            שעה: {game.time}<br/>
            רמה: {game.level}<br/>
            שחקנים: {game.currentPlayers}/{game.playersNeeded}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ccc' }}>
              <small style={{ color: '#666' }}>לחץ כדי לראות פרטים</small>
            </div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Create GeoJSON from games
  const geoJsonData = {
    type: 'FeatureCollection',
    features: games.map((game) => ({
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

  const handleCreateGame = () => {
    if (selectedLocation) {
      navigate(`/create-game?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`);
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setShowDialog(false);
  };

  // Get upcoming games count (games with future dates)
  const upcomingGamesCount = games.length;

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h2 className={styles.navTitle}>FootVolley TLV</h2>
        <div className={styles.navButtons}>
          <button className={styles.navBtn} title="פרופיל משתמש">
            <span className={styles.navIcon}>👤</span>
            פרופיל
          </button>
          <button className={styles.navBtn} title="הגדרות">
            <span className={styles.navIcon}>⚙️</span>
            הגדרות
          </button>
        </div>
      </nav>

      {/* <header className={styles.header}>
        <h1 className={styles.title}>FootVolley TLV</h1>
        <p className={styles.subtitle}>Click on the map to select a location</p>
      </header> */}

      <div className={styles.mapContainer}>
        <MapContainer 
          center={[32.0853, 34.7692]} 
          zoom={12} 
          minZoom={10}
          maxZoom={19}
          style={{ height: '100%', width: '100%' }}
          maxBounds={[[31.8, 34.6], [32.3, 35.0]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {games.length > 0 && games.map((game) => (
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
            <p className={styles.infoValue}>{games.reduce((sum, g) => sum + g.currentPlayers, 0)} שחקנים</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
