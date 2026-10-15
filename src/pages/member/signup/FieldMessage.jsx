import styles from './SignupStep.module.css';

function FieldMessage({ message }) {
  if (!message) return null;

  return (
    <p className={`${styles.message} ${styles[message.type]}`}>
      <span className="material-symbols-outlined">
        {message.type === 'success' ? 'check_circle' : 'error'}
      </span>
      {message.text}
    </p>
  );
}

export default FieldMessage;
