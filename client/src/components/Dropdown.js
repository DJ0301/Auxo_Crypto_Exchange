import React from 'react';
import './Dropdown.css'; // For styling the dropdown
import Eth from '../eth.svg';
import Poly from '../poly.png';
import Dia from '../dia.webp';


const Dropdown = ({ onSelect }) => {
  return (
    <div className="dropdown">
      <div className="dropdownItem" onClick={() => onSelect('Ethereum', Eth)}>
        <img src={Eth} alt="option1" className="eth" />
        <span className="itemText">Ethereum</span>
      </div>
      <div className="dropdownItem" onClick={() => onSelect('Diamate', Dia)}>
        <img src={Dia} alt="option2" className="eth" />
        <span className="itemText">Diamate</span>
      </div>
      <div className="dropdownItem" onClick={() => onSelect('Polygon', Poly)}>
        <img src={Poly} alt="option3" className="eth" />
        <span className="itemText">Polygon</span>
      </div>
    </div>
  );
};

export default Dropdown;
