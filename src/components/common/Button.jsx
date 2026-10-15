import styles from './Button.module.css';

function Button({
                  variant = 'primary',
                  type = 'button',
                  fullWidth = false,
                  leftIcon,
                  rightIcon,
                  className,
                  children,
                  ...rest
                }) {
  const buttonClassName = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={buttonClassName} {...rest}>
      {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && (
        <span className={`material-symbols-outlined ${styles.rightIcon}`} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}

export default Button;
