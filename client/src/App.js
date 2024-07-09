import React, { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Tokens from "./components/Product";
import { Routes, Route } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import BackgroundVideo from "./components/BackgroundVideo";
import Chatbot from "./components/Chatbot";
import ToOther from "./components/ToOther";
import AssetTrading from "./components/AssetTrading";
import StarWars from "./components/StarWars";

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userPublicKey, setUserPublicKey] = useState('');

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  const openLogin = () => {
    console.log('Opening login');
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    console.log('Closing login');
    setIsLoginOpen(false);
  };



  return (
    <div className="App">
      <BackgroundVideo />
      <Header connect={connect} isConnected={isConnected} address={address} openModal={openLogin} />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Swap setUserPublicKey={setUserPublicKey}  isLoginOpen={isLoginOpen} 
                closeLogin={closeLogin} 
                loggedIn={loggedIn} 
                setLoggedIn={setLoggedIn}  />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/to-other" element={<ToOther />} />
          <Route path="/asset-trading" element={<AssetTrading userPublicKey={userPublicKey} />} />
      </Routes>
      </div>
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <img src="/chatbot (1).png" alt="Chatbot Icon" id="chatbotlogo" />
      </div>

      {/* Render the chatbot */}
      {isChatbotOpen && <Chatbot onClose={toggleChatbot} />}

      {/* Print statement indicating login status */}
      {loggedIn && (
        <p className="publickey">Your Public Key: {userPublicKey}</p>
      )}
      {!userPublicKey && (
      <StarWars />
      )}
    </div>
  );
}
// this is new updated code
export default App;
