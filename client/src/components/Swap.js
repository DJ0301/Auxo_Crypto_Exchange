import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import './Swap.css'
import { DownOutlined, CopyOutlined, LoadingOutlined } from '@ant-design/icons';
import {  Dropdown, Menu, Spin } from 'antd'; 
import BitcoinIcon from '../icons/bitcoin-btc-logo.png';
import EthereumIcon from '../icons/ethereum-eth-logo.png';
import DogecoinIcon from '../icons/dogecoin-doge-logo.png';

const Swap = ({ setUserPublicKey }) => {
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [userSecret, setUserSecret] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('TestBTC');
  const [userPublicKey, setUserPublicKeyLocal] = useState('');
  const [transactionID, setTransactionID] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [isTradeForDiam, setIsTradeForDiam] = useState(true); // State to toggle between trade types
  const [accountBalances, setAccountBalances] = useState({});
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // State to manage loading during transaction processing
  const [showLoginPopup, setShowLoginPopup] = useState(false); // State to manage login popup visibility
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [newUserSecret, setNewUserSecret] = useState('');
  const [newUserPublicKey, setNewUserPublicKey] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const items = [
    {
      label: 'BTC',
      key: 'TestBTC',
      icon: <img src={BitcoinIcon} alt="BTC" style={{ width: '20px', height: '20px' }} />,
    },
    {
      label: 'ETH',
      key: 'TestETH',
      icon: <img src={EthereumIcon} alt="ETH" style={{ width: '20px', height: '20px' }} />,
    },
    {
      label: 'DOGE',
      key: 'TestDOGE',
      icon: <img src={DogecoinIcon} alt="DOGE" style={{ width: '20px', height: '20px' }} />,
    },

  ]; 
   const handleMenuClick = (e) => {
    console.log('click', e);
    setAsset(e.key);
  };  
const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const showToast = (message, type = 'info') => {
    toast[type](message, {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };


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

  useEffect(() => {
    if (loggedIn && userPublicKey) {
      fetchAccountBalances(userPublicKey);
    }
  }, [loggedIn, userPublicKey]);

  useEffect(() => {
    if (asset) {
      fetchTokenPrice(asset);
    }
  }, [asset]);

  useEffect(() => {
    if (tokenPrice && amount) {
      if (isTradeForDiam) {
        setReceiveAmount(amount / tokenPrice);
      } else {
        setReceiveAmount(amount * tokenPrice);
      }
    } else {
      setReceiveAmount(0);
    }
  }, [amount, tokenPrice, isTradeForDiam]);

  useEffect(() => {
    if (accountBalances[asset] == undefined) {
      setInsufficientFunds(true);
      accountBalances[asset] = 0;
    }

    if (amount && accountBalances[asset] !== undefined) {
      const assetBalance = parseFloat(accountBalances[asset]);
      const diamBalance = parseFloat(accountBalances['DIAM']);

      if (isTradeForDiam) {
        if (amount > assetBalance) {
          setInsufficientFunds(true);
        } else {
          setInsufficientFunds(false);
        }
      } else {
        if (amount > diamBalance) {
          setInsufficientFunds(true);
        } else {
          setInsufficientFunds(false);
        }
      }
    }
  }, [amount, asset, accountBalances, receiveAmount, isTradeForDiam]);

  const fetchUserPublicKey = async (secret) => {
    try {
      const response = await axios.post('https://auxo-crypto-exchange.onrender.com/login', {
        UserSecret: secret,
      });

      setUserPublicKeyLocal(response.data.publicKey);
      setUserPublicKey(response.data.publicKey);
      toast.success('Login successful');
    } catch (error) {
      console.error('Error fetching public key:', error);
    }
  };

  const fetchTokenPrice = async (asset) => {
    try {
      const response = await axios.post('https://auxo-crypto-exchange.onrender.com/fetch-token-price', {
        asset: asset,
      });

      setTokenPrice(response.data.price);
    } catch (error) {
      console.error('Error fetching token price:', error);
      toast.error('Failed to fetch token price');
    }
  };

  const fetchAccountBalances = async (publicKey) => {
    try {
      const response = await axios.post(`https://auxo-crypto-exchange.onrender.com/get-balances`, {
        publicKey: publicKey,
      });
      
      const balances = response.data.balances.reduce((acc, balance) => {
        if (balance.assetCode) {
          acc[balance.assetCode] = balance.balance;
        } else {
          acc['DIAM'] = balance.balance;
        }
        return acc;
      }, {});
  
      setAccountBalances(balances);
    } catch (error) {
      console.error('Error fetching account balances:', error);
    }
  };


  const handleLogin = async () => {
    try {
      const response = await axios.post('https://auxo-crypto-exchange.onrender.com/login', {
        UserSecret: userSecret,
      });

      setUserPublicKeyLocal(response.data.publicKey);
      setUserPublicKey(response.data.publicKey);
      setLoggedIn(true);

      if (keepLoggedIn) {
        localStorage.setItem('userSecret', userSecret);
        localStorage.setItem('keepLoggedIn', 'true');
      } else {
        sessionStorage.setItem('userSecret', userSecret);
        sessionStorage.setItem('keepLoggedIn', 'true');
      }

      setShowLoginPopup(false);
      showToast('Login successful!', 'success');
    } catch (error) {
      console.error('Error logging in:', error);
      showToast(`Login failed: ${error.response?.data?.message || error.message}`, 'error');
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

  const handleSwap = () => {
    setShowConfirmation(true); // Display confirmation dialog
  };

  const confirmSwap = async () => {
    setIsProcessing(true);
  
    try {
      const endpoint = isTradeForDiam ? 'trade-for-DIAM' : 'trade-for-assets';
      const response = await axios.post(`https://auxo-crypto-exchange.onrender.com/${endpoint}`, {
        UserSecret: userSecret,
        amount: amount,
        asset: asset,
      });
  
      const id = response.data.transactionID || response.data.transactionHashes.assetSend;
      setTransactionID(id);
      console.log('Transaction ID:', id);
      showToast('Trade successful!', 'success');
      await fetchAccountBalances(userPublicKey);
      setAmount('');
      setShowTransactionPopup(true); // Show the transaction popup
    } catch (error) {
      console.error('Error trading:', error);
      showToast(`Trade failed: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };
  


  const formatCurrentPrice = () => {
    if (isTradeForDiam) {
      return `${amount} ${asset} for ${(amount / tokenPrice).toFixed(2)} DIAM`;
    } else {
      return `${amount} DIAM for ${(amount * tokenPrice).toFixed(2)} ${asset}`;
    }
  };

  const handleConnectWallet = () => {
    setShowWalletOptions(true);
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const response = await axios.post('https://auxo-crypto-exchange.onrender.com/register');
      setNewUserSecret(response.data.secretKey);
      setNewUserPublicKey(response.data.publicKey);
      setShowRegisterPopup(true);
      showToast('Registration successful!', 'success');
    } catch (error) {
      console.error('Error registering:', error);
      showToast(`Registration failed: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  return (
    <>
      {!showLoginPopup && !showWalletOptions && !showRegisterPopup && (
        <div className="header1" style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="login-button">
            <br/><br/><br/>
            {!loggedIn ? (
              <button onClick={handleConnectWallet}>Connect Wallet</button>
            ) : (
              null
            )}
            <br/><br/><br/>
          </div>
        </div>
      )}  

{showWalletOptions && (
        <div className="wallet-options-popup">
          <div className="wallet-options-header">Connect Wallet</div>
          <div className="wallet-options-buttons">
            <button onClick={() => {setShowLoginPopup(true); setShowWalletOptions(false);}}>Login</button>
            <button onClick={handleRegister} disabled={isRegistering}>
              {isRegistering ? <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} /> : 'Register'}
            </button>
          </div>
          <button className="cancel-button" onClick={() => setShowWalletOptions(false)}>Cancel</button>
        </div>
      )}

      {isRegistering && (
        <div className="loading-screen">
          <Spin size="large" />
          <p>Creating your keypair...</p>
        </div>
      )}

      {showRegisterPopup && (
        <div className="register-popup">
          <div className="register-header">New Account Created</div>
          <div className="register-info">
            <div className="info-row">
              <span>Secret Key:</span>
              <input type="text" value={newUserSecret} readOnly />
              <CopyOutlined onClick={() => copyToClipboard(newUserSecret)} />
            </div>
            <div className="info-row">
              <span>Public Key:</span>
              <input type="text" value={newUserPublicKey} readOnly />
              <CopyOutlined onClick={() => copyToClipboard(newUserPublicKey)} />
            </div>
          </div>
          <p className="warning-text">Please save your Secret Key securely. It will not be shown again.</p>
          <button onClick={() => setShowRegisterPopup(false)}>Close</button>
        </div>
      )}

      {showLoginPopup && (
        <div className="login-popup">
          <div className="login-header">Connect Wallet</div>
          <input
            type="text"
            className="texting"Z
            placeholder="Enter your secret"
            value={userSecret}
            onChange={(e) => setUserSecret(e.target.value)}
          />
          <div className="remember-me">
            <input
              type="checkbox"
              id="keepLoggedIn"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
            <label htmlFor="keepLoggedIn">Keep me logged in</label>
          </div>
          <div className="login-buttons">
            <button className="loginANDcancel" onClick={handleLogin}><span className="loginANDcancellogintext">Login</span></button>
            <button className="loginANDcancel" onClick={() => setShowLoginPopup(false)}><span className="loginANDcancelcanceltext">Cancel</span> </button>
          </div>
        </div>
      )}

        {loggedIn && (
          <div className="tradeBox scrollable-content">
            <div className="tradeBoxHeader">
            <div className="onlineCircle"></div>
              <p>{userPublicKey.slice(0,10)}....</p>
              <button className="disconnetBTN"  onClick={handleLogout} style={{ marginTop: '10px' }}>
             <span className='disText'>Disconnect</span> 
            </button>
            </div>
            <div >
              <div className='radio-inputs'>
                <label className="radio">
                <input
                  type="radio"
                  name="radio"
                  checked={isTradeForDiam}
                  onChange={() => setIsTradeForDiam(true)}
                />
                <span className="name">Trade for DIAM</span>
              </label >
              <label className="radio">
                <input
                  type="radio"
                  name="radio"
                  checked={!isTradeForDiam}
                  onChange={() => setIsTradeForDiam(false)}
                />
               <span className="name">Trade for Assets</span> 
              </label>
              </div>
              
              <div className="inputs">
                <input
                  className="texting"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                />
                  <Dropdown overlay={
        <Menu onClick={(e) => handleMenuClick(e)}>
          {items.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      }>
        <button className="ant-dropdown-link" onClick={e => e.preventDefault()}>
          {items.find((item) => item.key === asset)?.icon} {/* Display selected option icon */}
          <span className="text-cont">{items.find((item) => item.key === asset)?.label}</span> {/* Display selected option label */}
          <DownOutlined />
        </button>
      </Dropdown>
                {/* <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className='Dropdown'
                >
                  <option value="TestBTC">BTC</option>
                  <option value="TestETH">ETH</option>
                  <option value="TestDOGE">DOGE</option>
                </select> */}
                <div className="assetOne">
                  <p className='assetOneText'> Current Price: {formatCurrentPrice()}</p>
                </div>
                
               
                <div className='ButtonFix'>
                   <button
                  className="swapButton"
                  onClick={handleSwap}
                  disabled={!amount || !tokenPrice || insufficientFunds}
                >
                  Swap
                </button> 
                </div>
               {insufficientFunds && (
                  <p className="insufficientFundsMessage">Insufficient Funds</p>
                )}
                <div className="assetTwo">
                  {/* <p className='assetTwoText'>
                    You will receive: {receiveAmount.toFixed(2)}{' '}
                    {isTradeForDiam ? 'DIAM' : asset}
                  </p> */}
                </div>
              </div>
            </div>
            <div className="accountBalances">
              <h3>Account Balances</h3>
              
                <p>{asset}: {accountBalances[asset] || 'Loading...'}</p>
                <p>DIAM: {accountBalances['DIAM'] || 'Loading...'}</p>
                {/* Add additional asset balances here */}
             
            </div>
            
        {showTransactionPopup && (
  <TransactionPopup 
    transactionID={transactionID} 
    onClose={() => setShowTransactionPopup(false)} 
  />
)}
          </div>
        )}


        {showConfirmation && (
          <div className="confirmationPopup">
            <p>Confirm your transaction:</p>
            <p>{formatCurrentPrice()}</p>
            {isProcessing ? (
              <p>Processing...</p>
            ) : (
              <>
                <button className="confirmbtn" onClick={confirmSwap}>Confirm</button>
                <button className="confirmbtn" onClick={() => setShowConfirmation(false)}>Cancel</button>
              </>
            )}
          </div>
        )}
    </>
  );
}

const TransactionPopup = ({ transactionID, onClose }) => (
  <div className="transactionPopup">
    <div className="transactionPopupContent">
      <h3>Transaction Successful</h3>
      <p>Transaction ID:</p>
      <p className="transaction-id">{transactionID}</p>
      <a
        href={`https://testnetexplorer.diamcircle.io/`}
        target="_blank"
        rel="noopener noreferrer"
        className='ViewTestNet'
      >
        View Testnet Explorer
      </a>
      <br />
      <button onClick={onClose}>Close</button>
      <p className="note">Note: Copy your transaction ID and paste it in the testnet explorer to view your transaction!</p>
    </div>
  </div>
);

export default Swap;
