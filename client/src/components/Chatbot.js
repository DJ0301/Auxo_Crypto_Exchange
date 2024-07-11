import React from 'react';
import './Chatbot.css';

const Chatbot = ({ onClose }) => {
  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <h3>The DIAMMANTOR</h3>
        <button onClick={onClose} id='xbutton'>X</button>
      </div>
      <div className="chatbot-iframe-container">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/5O13FoRS5z6AGKwbtZJEc"
          width="100%"
          style={{ height: '100%', minHeight: '370px'}}
          frameBorder="0"
          title="Chatbot"
        ></iframe>
      </div>
    </div>
  );
};

export default Chatbot;
