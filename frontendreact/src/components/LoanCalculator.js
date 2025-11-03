import React, { useState } from 'react';

function LoanCalculator({ onCalculate }) {
  const [income, setIncome] = useState('');
  const [emi, setEmi] = useState('');
  const [propertyValue, setPropertyValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate({ income, emi, propertyValue });
  };

  return (
    <div className="loan-calculator">
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Monthly Income (₹)"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
        <input
          type="number"
          placeholder="Existing EMIs (₹)"
          value={emi}
          onChange={(e) => setEmi(e.target.value)}
        />
        <input
          type="number"
          placeholder="Property Value (₹)"
          value={propertyValue}
          onChange={(e) => setPropertyValue(e.target.value)}
        />
        <button type="submit">Calculate</button>
      </form>
    </div>
  );
}
