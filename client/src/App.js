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
import Login from "./components/Login";
import AssetTrading from './components/AssetTrading';
import ToOther from "./components/ToOther";

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });

  const [isChatbotOpen, setIsChatbotOpen] = useState(false); 
  const [isLoginOpen, setIsLoginOpen] = useState(false); // Update state name
  const [loggedIn, setLoggedIn] = useState(false); // State to manage login status

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  const openLogin = () => { // Update function name
    console.log('Opening login');
    setIsLoginOpen(true);
  };

  const closeLogin = () => { // Update function name
    console.log('Closing login');
    setIsLoginOpen(false);
  };

  const handleLoginSuccess = () => {
    setLoggedIn(true);
    // closeLogin(); // Close the login panel after successful login
  };


  return (
      
    <div className="App">
      <BackgroundVideo />
      <Header connect={connect} isConnected={isConnected} address={address} openModal={openLogin} />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Swap />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/to-other" element={<ToOther />} />
        </Routes>
      </div>
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <img src="/chatbot (1).png" alt="Chatbot Icon" id="chatbotlogo" />
      </div>

      {/* Render the chatbot */}
      {isChatbotOpen && <Chatbot onClose={toggleChatbot} />}
      <Login isOpen={isLoginOpen} onClose={closeLogin}> {/* Update component name */}
        <div className="connect-wallet-content">
        <AssetTrading onLogin={handleLoginSuccess} />
        </div>
      </Login>
      

      {/* Print statement indicating login status */}
     

    </div>
  )
}

export default App;
