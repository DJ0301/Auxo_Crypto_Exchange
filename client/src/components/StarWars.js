import React, { useRef, useEffect } from 'react';
import './StarWars.css';

const StarWars = () => {
  const textRef = useRef(null);

  useEffect(() => {
    const handleTouchStart = () => {
      textRef.current.style.animationPlayState = 'paused';
    };

    const handleTouchEnd = () => {
      textRef.current.style.animationPlayState = 'running';
    };

    const textElement = textRef.current;

    textElement.addEventListener('touchstart', handleTouchStart);
    textElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      textElement.removeEventListener('touchstart', handleTouchStart);
      textElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="star-wars-text">
      <p className="crawl-text" ref={textRef}>
        Episode IV<br/>
        A NEW HOPE<br/>
        Welcome to AUXO, where the Force meets blockchain. Step into a galaxy of trading opportunities where you can exchange your favorite tokens for DIAM and harness the power of decentralized finance. Whether you're a Jedi Knight or a Sith Lord of trading, AUXO empowers you to navigate the stars of the Diamante blockchain universe. May the trades be with you.
        <br/><br/>
        Please note that AUXO is a decentralized exchange and does not provide financial advice. Always do your own research before trading.
        <br/><br/>
        Please login to continue.
      </p>
    </div>
  );
};

export default StarWars;
