import React, {useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../logoTouse.png';
import Eth from '../eth.svg';
import Dropdown from './Dropdown'; // Import the Dropdown component
// import Modal from './Modal';
import axios from 'axios';
import { toast } from 'react-toastify';
import Dia from '../dia.webp';

function Header(props) {
  const { address, isConnected, openModal } = props;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Diamante');
  const [selectedIcon, setSelectedIcon] = useState(Dia);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // TEsting begins
  const [userSecret, setUserSecret] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [userPublicKey, setUserPublicKey] = useState('');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  // End of TEsting

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleSelect = (option, icon) => {
    setSelectedOption(option);
    setSelectedIcon(icon);
    setDropdownOpen(false);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // TESTING BEGINS

  useEffect(() => {
    const storedUserSecret = localStorage.getItem('userSecret');
    const storedKeepLoggedIn = localStorage.getItem('keepLoggedIn');

    if (storedUserSecret && storedKeepLoggedIn === 'true') {
      setUserSecret(storedUserSecret);
      setLoggedIn(true);
      setKeepLoggedIn(true);
      fetchUserPublicKey(storedUserSecret); // Fetch user's public key if already logged in
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: userSecret,
      });

      setUserPublicKey(response.data.publicKey);
      setLoggedIn(true);

      if (keepLoggedIn) {
        localStorage.setItem('userSecret', userSecret);
        localStorage.setItem('keepLoggedIn', 'true');
      } else {
        sessionStorage.setItem('userSecret', userSecret);
        sessionStorage.setItem('keepLoggedIn', 'true');
      }

      setShowLoginPopup(false); // Hide the login popup after successful login
      toast.success('Login successful');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Login failed');
    }
  };

  const handleLogout = () => {
    setUserSecret('');
    setUserPublicKey('');
    setLoggedIn(false);
    setKeepLoggedIn(false);
    localStorage.removeItem('userSecret');
    localStorage.removeItem('keepLoggedIn');
    sessionStorage.removeItem('userSecret');
    sessionStorage.removeItem('keepLoggedIn');
    toast.info('Logged out');
  };

  const fetchUserPublicKey = async (secret) => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: secret,
      });

      setUserPublicKey(response.data.publicKey);
      toast.success('Login successful');
    } catch (error) {
      console.error('Error fetching public key:', error);
      toast.error('Failed to fetch public key');
    }
  };
  // enD OF TESTING

  return (
    <header>
      <div className="leftH">
        <img src={Logo} alt="logo" className="logo" />
          <div className="Auxo"><h1>Auxo</h1></div>
        
        <Link to="/" className="link">
          <div className="headerItem">Swap</div>
        </Link>
        <Link to="/tokens" className="link">
          {/* <div className="link headerItem" onClick={paymentHandler}>UPI Payments</div> */}
          <div className="headerItem" >Buy with UPI</div>
        </Link>
      </div>
      <div className="rightH">
        <div className="headerItem" id="selectProvider" onClick={toggleDropdown}>
          <img src={selectedIcon} alt="eth" className="eth" />
          {selectedOption}
          <img src="/down-arrow.svg" alt="arrow" id="downarrow" />
          {isDropdownOpen && <Dropdown onSelect={handleSelect} />} {/* Pass the handler to Dropdown */}
        </div>
      </div>
      
    </header>
  );
}


export default Header;
