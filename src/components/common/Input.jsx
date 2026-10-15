import { useId, useState } from 'react';
import styles from './Input.module.css';

function Input({ id, label, icon, type = 'text', error, ...rest }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const inputClassName = [
    styles.input,
    icon && styles.withIcon,
    isPassword && styles.withToggle,
    error && styles.invalid,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {icon && (
          <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          className={inputClassName}
          aria-invalid={error ? true : undefined}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export default Input;
