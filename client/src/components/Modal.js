import React, { useState } from 'react';
import './Modal.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Modal = ({ show, onClose, setUserSecret, setUserPublicKey, setLoggedIn, keepLoggedIn, setKeepLoggedIn }) => {
  const [userSecretInput, setUserSecretInput] = useState('');

  const handleLogin = async () => {
    try {
      console.log('User Secret:', userSecretInput); // Debugging log

      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: userSecretInput,
      });

      console.log('Login Response:', response.data); // Debugging log

      setUserPublicKey(response.data.publicKey);
      setLoggedIn(true);

      if (keepLoggedIn) {
        localStorage.setItem('userSecret', userSecretInput);
        localStorage.setItem('keepLoggedIn', 'true');
      } else {
        sessionStorage.setItem('userSecret', userSecretInput);
        sessionStorage.setItem('keepLoggedIn', 'true');
      }

      setUserSecret(userSecretInput);
      onClose(); // Close the modal after successful login
      toast.success('Login successful');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Login failed');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        <div className="modal-body">
          <h2>Sign In</h2>
          <input
            type="text"
            placeholder="User Secret"
            autocomplete="off"
            required="true"
            value={userSecretInput}
            onChange={(e) => setUserSecretInput(e.target.value)}
            className="texting"
          />
          <label className='keepmelogin'>
            Keep me logged in
            <input
              type="checkbox"
              className="check"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
          </label>
          <button onClick={handleLogin} class="buttonLogin">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
