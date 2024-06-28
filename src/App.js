import React, { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Tokens from "./components/UPI";
import { Routes, Route } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import BackgroundVideo from "./components/BackgroundVideo";
import Chatbot from "./components/Chatbot";

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });

  const [isChatbotOpen, setIsChatbotOpen] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
      
    <div className="App">
      <BackgroundVideo />
      <Header connect={connect} isConnected={isConnected} address={address} />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Swap isConnected={isConnected} address={address} />} />
          <Route path="/tokens" element={<Tokens />} />
        </Routes>
      </div>
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <img src="/chatbot (1).png" alt="Chatbot Icon" id="chatbotlogo" />
      </div>

      {/* Render the chatbot */}
      {isChatbotOpen && <Chatbot onClose={toggleChatbot} />}
    </div>
  )
}

export default App;
