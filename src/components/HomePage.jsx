import { Link } from 'react-router-dom';
import { beachLocations } from '../data/mockData';
import styles from './HomePage.module.css';

function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>FootVolley TLV</h1>
        <p className={styles.subtitle}>Find and organize footvolley games at Israeli beaches</p>
      </header>

      <div className={styles.locationsGrid}>
        {beachLocations.map((location) => (
          <Link 
            key={location.id} 
            to={`/location/${location.id}`}
            className={styles.locationCard}
          >
            <h2 className={styles.locationName}>{location.name}</h2>
            <p className={styles.locationCity}>{location.city}</p>
            <p className={styles.locationDescription}>{location.description}</p>
            <span className={styles.viewGames}>View Games →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
