import React from 'react';
import './Login.css';

const Login = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="login-overlay">
      <div className="login-content">
        <h2 className="LoginHeader">Auxo</h2>
        
        <button className="login-close" onClick={onClose}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="white"
          >
            <path d="M14.292 6.708L8 13l6.292 6.292 1.416-1.416L10.832 13l4.876-4.876z"/>
          </svg>
        </button>
        {children}
  
      </div>
    </div>
  );
};

export default Login;
