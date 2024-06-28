import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../moralis-logo.svg';
import Eth from '../eth.svg';
import Dropdown from './Dropdown'; // Import the Dropdown component

function Header(props) {
  const { address, isConnected, connect } = props;
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
          <div className="headerItem">Swap</div>
        </Link>
        <Link to="/tokens" className="link">
          <div className="headerItem">UPI Payments</div>
        </Link>
      </div>
      <div className="rightH">
        <div className="headerItem" id="selectProvider" onClick={toggleDropdown}>
          <img src={selectedIcon} alt="eth" className="eth" />
          {selectedOption}
          <img src="/down-arrow.svg" alt="arrow" id="downarrow" />
          {isDropdownOpen && <Dropdown onSelect={handleSelect} />} {/* Pass the handler to Dropdown */}
        </div>
        <div className="connectButton" onClick={connect}>
          {isConnected ? address.slice(0, 4) + '...' + address.slice(38) : 'Connect'}
        </div>
      </div>
    </header>
  );
}

export default Header;
