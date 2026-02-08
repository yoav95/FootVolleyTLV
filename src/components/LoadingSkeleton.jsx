import styles from './LoadingSkeleton.module.css';

export function GameCardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.skeletonHeader}>
        <div className={`${styles.skeleton} ${styles.skeletonCircle}`}></div>
        <div className={`${styles.skeleton} ${styles.skeletonText}`}></div>
      </div>
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`}></div>
      <div className={`${styles.skeleton} ${styles.skeletonText}`}></div>
      <div className={`${styles.skeleton} ${styles.skeletonButton}`}></div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className={styles.pageLoadingSkeleton}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>טוען...</p>
      </div>
    </div>
  );
}

export default { GameCardSkeleton, PageLoadingSkeleton };
