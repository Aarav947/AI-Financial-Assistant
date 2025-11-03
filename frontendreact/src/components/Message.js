import React from 'react';
import WorkflowCard from './WorkflowCard';
import BankSelector from './BankSelector';

function Message({ message, onBankSelect }) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`message ${isBot ? 'bot-message' : 'user-message'}`}>
      <div className="message-content">
        <p>{message.text}</p>

        {/* Bank selection buttons */}
        {message.type === 'bank_selection' && message.available_banks && (
          <BankSelector 
            banks={message.available_banks} 
            onBankSelect={onBankSelect}
          />
        )}

        {/* Workflow cards */}
        {message.type === 'workflow' && message.workflows && (
          <div className="workflows">
            {message.workflows.map((workflow, idx) => (
              <WorkflowCard key={idx} workflow={workflow} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
