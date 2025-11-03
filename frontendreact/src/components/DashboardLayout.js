import React from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import NewsPanel from './NewsPanel';
import AnalyticsDashboard from './AnalyticsDashboard';

const DashboardLayout = ({ messages, loading, onBankSelect, onSendMessage }) => {
  return (
    <div className="dashboard-container">
      {/* Left Panel - Your Existing Chat */}
      <div className="left-panel">
        <div className="chat-header-panel">
          <h2>🏦 AI Financial Advisor</h2>
          <p>Your AI-powered banking helper</p>
        </div>
        <div className="chat-content-panel">
          <ChatWindow 
            messages={messages} 
            loading={loading}
            onBankSelect={onBankSelect}
            onSendMessage={onSendMessage}  
          />
        </div>
        <div className="chat-input-panel">
          <ChatInput onSendMessage={onSendMessage} disabled={loading} />
        </div>
      </div>

      {/* Right Panel - News and Analytics */}
      <div className="right-panel">
        <div className="news-section">
          <NewsPanel />
        </div>
        <div className="analytics-section">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
