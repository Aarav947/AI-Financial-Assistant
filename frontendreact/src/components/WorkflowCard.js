import React from 'react';

function WorkflowCard({ workflow, options, onOptionClick, isLast }) {
  return (
    <>
      {/* Workflow Card */}
      <div className={`workflow-card ${workflow.urgent ? 'urgent' : ''}`}>
        <h3 className="workflow-title">
          {workflow.urgent && '⚠️ '}
          {workflow.name}
        </h3>
        <ol className="workflow-steps">
          {workflow.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
        {workflow.link && (
          <a
            href={workflow.link}
            target="_blank"
            rel="noopener noreferrer"
            className="workflow-link"
          >
            🔗 Open Link
          </a>
        )}
      </div>

      {/* Option Buttons - Beautiful Version */}
      {isLast && options && options.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <p style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              color: '#4b5563',
              margin: 0
            }}>
              What would you like to do next?
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onOptionClick(option.value)}
                className="option-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(99, 102, 241, 0.4), 0 8px 10px -5px rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1)';
                }}
              >
                <span style={{
                  fontSize: '18px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}>
                  {option.label.includes('Calculate') ? '🧮' : 
                   option.label.includes('documents') ? '📄' : '📋'}
                </span>
                <span>{option.label.replace(/🧮|📄|📋/g, '').trim()}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '16px',
                  opacity: 0.8
                }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default WorkflowCard;
