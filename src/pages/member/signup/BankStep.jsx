import { useState } from 'react';
import Button from '../../../components/common/Button';
import { BANKS } from '../../../constants/banks';
import FieldMessage from './FieldMessage';
import styles from './SignupStep.module.css';

const ACCOUNT_NO_REGEX = /^\d{10,14}$/;

function BankStep({ initialData, onNext, onPrev }) {
  const [bankCode, setBankCode] = useState(initialData.bankCode ?? '');
  const [accountNo, setAccountNo] = useState(initialData.accountNo ?? '');
  const [accountHolder, setAccountHolder] = useState(initialData.accountHolder ?? '');

  const isAccountNoValid = ACCOUNT_NO_REGEX.test(accountNo);
  const showAccountNoError = accountNo.length > 0 && !isAccountNoValid;
  const canProceed = bankCode !== '' && isAccountNoValid && accountHolder.trim() !== '';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canProceed) return;

    onNext({ bankCode, accountNo, accountHolder: accountHolder.trim() });
  };

  return (
    <section className={styles.card}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className={styles.title}>정산·환급 계좌를 등록해 주세요</h2>
          <p className={styles.subtitle}>
            예치금 충전·환불과 판매 대금 정산에 사용할 본인 명의 계좌입니다.
          </p>
        </div>

        <div className={styles.notice}>
          <span className="material-symbols-outlined">lock</span>
          계좌번호는 암호화되어 저장됩니다.
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-bank" className={styles.label}>
            은행 <span className={styles.required}>*</span>
          </label>
          <div className={styles.selectWrap}>
            <select
              id="signup-bank"
              className={styles.select}
              value={bankCode}
              onChange={(event) => setBankCode(event.target.value)}
            >
              <option value="" disabled>
                은행을 선택해 주세요
              </option>
              {BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <span className={`material-symbols-outlined ${styles.selectIcon}`}>expand_more</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-account-no" className={styles.label}>
            계좌번호 <span className={styles.required}>*</span>
          </label>
          <input
            id="signup-account-no"
            inputMode="numeric"
            className={styles.input}
            placeholder="숫자만 입력 (- 제외)"
            value={accountNo}
            onChange={(event) => setAccountNo(event.target.value.replace(/\D/g, '').slice(0, 14))}
          />
          {showAccountNoError && (
            <FieldMessage
              message={{ type: 'error', text: '계좌번호는 하이픈 없이 숫자 10~14자리여야 합니다.' }}
            />
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-account-holder" className={styles.label}>
            예금주 <span className={styles.required}>*</span>
          </label>
          <input
            id="signup-account-holder"
            className={styles.input}
            placeholder="예금주 이름"
            value={accountHolder}
            onChange={(event) => setAccountHolder(event.target.value)}
            maxLength={50}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.prevButton} onClick={onPrev}>
            <span className="material-symbols-outlined">arrow_back</span>
            이전
          </button>
          <Button
            type="submit"
            disabled={!canProceed}
            rightIcon="arrow_forward"
            className={styles.nextButton}
          >
            다음 단계로 (판매자 등록 선택)
          </Button>
        </div>
      </form>
    </section>
  );
}

export default BankStep;
