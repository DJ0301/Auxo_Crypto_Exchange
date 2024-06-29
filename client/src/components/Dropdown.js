import React from 'react';
import './Dropdown.css'; // For styling the dropdown
import Eth from '../eth.svg';


const Dropdown = ({ onSelect }) => {
  return (
    <div className="dropdown">
      <div className="dropdownItem" onClick={() => onSelect('Ethereum', Eth)}>
        <img src={Eth} alt="option1" className="eth" />
        <span className="itemText">Ethereum</span>
      </div>
      <div className="dropdownItem" onClick={() => onSelect('Diamate', Eth)}>
        <img src={Eth} alt="option2" className="eth" />
        <span className="itemText">Diamate</span>
      </div>
      <div className="dropdownItem" onClick={() => onSelect('Polygon', Eth)}>
        <img src={Eth} alt="option3" className="eth" />
        <span className="itemText">Polygon</span>
      </div>
    </div>
  );
};

export default Dropdown;
