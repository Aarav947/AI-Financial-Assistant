import React, { useEffect, useRef } from 'react';
import WorkflowCard from './WorkflowCard';

function ChatWindow({ messages, loading, onBankSelect, onSendMessage }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
        >
          {/* Message Text */}
          {message.text && <p className="message-text">{message.text}</p>}

          {/* Bank Selection Buttons */}
          {message.available_banks && (
            <div className="bank-selection">
              <p className="bank-prompt">Please select your bank:</p>
              <div className="bank-buttons">
                {message.available_banks.map((bank, idx) => (
                  <button
                    key={idx}
                    onClick={() => onBankSelect(bank)}
                    className="bank-button"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Cards */}
          {message.workflows && message.workflows.map((workflow, idx) => (
            <WorkflowCard
              key={idx}
              workflow={workflow}
              options={message.options}
              onOptionClick={(value) => onSendMessage(value)}
              isLast={idx === message.workflows.length - 1}
            />
          ))}
        </div>
      ))}

      {loading && (
        <div className="message bot-message">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatWindow;
