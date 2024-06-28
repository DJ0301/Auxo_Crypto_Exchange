import React, { useState, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Add initial welcome message
  useEffect(() => {
    setMessages([{ text: 'Hello user, how can I help you?', sender: 'bot' }]);
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      const newMessage = { text: input, sender: 'user' };
      setMessages([...messages, newMessage]);

      // Simulate chatbot response
      setTimeout(() => {
        setMessages(prevMessages => [
          ...prevMessages,
          { text: 'This is a response from the chatbot.', sender: 'bot' }
        ]);
      }, 1000);
      
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <h3>Chatbot</h3>
        <button onClick={onClose} id='xbutton'>X</button>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
