import React from 'react';

function BankSelector({ banks, onBankSelect }) {
  return (
    <div className="bank-selector">
      <p className="bank-prompt">Please select your bank:</p>
      <div className="bank-buttons">
        {banks.map((bank, idx) => (
          <button
            key={idx}
            className="bank-button"
            onClick={() => onBankSelect(bank)}
          >
            {bank}
          </button>
        ))}
      </div>
    </div>
  );
}

export default BankSelector;
