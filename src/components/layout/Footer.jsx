import styles from './Footer.module.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={`material-symbols-outlined ${styles.icon}`}>potted_plant</span>
          <span className={styles.name}>replant</span>
        </div>
        <p className={styles.description}>반려식물 C2C 안심 거래 마켓</p>
        <p className={styles.copyright}>© {year} replant · 팀 일단커밋</p>
      </div>
    </footer>
  );
}

export default Footer;
