import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../logoTouse.png';
import Eth from '../eth.svg';
import Dropdown from './Dropdown'; // Import the Dropdown component
import { paymentHandler } from '../paymentHandler.js';

function Header(props) {
  const { address, isConnected, openModal } = props;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Ethereum');
  const [selectedIcon, setSelectedIcon] = useState(Eth);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleSelect = (option, icon) => {
    setSelectedOption(option);
    setSelectedIcon(icon);
    setDropdownOpen(false);
  };

  return (
    <header>
      <div className="leftH">
        <img src={Logo} alt="logo" className="logo" />
        <Link to="/" className="link">
          <div className="Auxo"><h1>Auxo</h1></div>
        </Link>
        
        <Link to="/" className="link">
          <div className="headerItem">Swap</div>
        </Link>
        <Link to="/tokens" className="link">
          {/* <div className="link headerItem" onClick={paymentHandler}>UPI Payments</div> */}
          <div className="headerItem" >UPI Payments</div>
        </Link>
      </div>
      <div className="rightH">
        <div className="headerItem" id="selectProvider" onClick={toggleDropdown}>
          <img src={selectedIcon} alt="eth" className="eth" />
          {selectedOption}
          <img src="/down-arrow.svg" alt="arrow" id="downarrow" />
          {isDropdownOpen && <Dropdown onSelect={handleSelect} />} {/* Pass the handler to Dropdown */}
        </div>
        <div className="connectButton" onClick={()=>{
           console.log('Connect Wallet button clicked');
           openModal();
        }}>
          {isConnected ? address.slice(0, 4) + '...' + address.slice(38) : 'Connect'}
        </div>
      </div>
    </header>
  );
}

export default Header;
