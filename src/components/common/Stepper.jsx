import styles from './Stepper.module.css';

const STATUS_TEXT = {
  completed: '완료됨',
  current: '입력 진행중',
};

function getStatus(index, currentStep) {
  if (index < currentStep) return 'completed';
  if (index === currentStep) return 'current';
  return 'upcoming';
}

function Stepper({ steps, currentStep }) {
  return (
    <ol className={styles.stepper}>
      {steps.map((step, index) => {
        const status = getStatus(index, currentStep);
        const isReached = index <= currentStep;

        return (
          <li
            key={step.title}
            className={`${styles.step} ${styles[status]} ${isReached ? styles.reached : ''}`}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className={styles.circle}>
              <span className="material-symbols-outlined">
                {status === 'completed' ? 'check' : step.icon}
              </span>
            </span>
            <span className={styles.title}>
              {index + 1}단계: {step.title}
            </span>
            <span className={styles.status}>{STATUS_TEXT[status] ?? step.description}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
