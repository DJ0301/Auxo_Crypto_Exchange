import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Swap.css'


const Swap = ({setUserPublicKey}) => {
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
        if (receiveAmount > diamBalance) {
          setInsufficientFunds(true);
        } else {
          setInsufficientFunds(false);
        }
      }
    }
  }, [amount, asset, accountBalances, receiveAmount, isTradeForDiam]);

  const fetchUserPublicKey = async (secret) => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: secret,
      });

      setUserPublicKeyLocal(response.data.publicKey);
      setUserPublicKey(response.data.publicKey);
      toast.success('Login successful');
    } catch (error) {
      console.error('Error fetching public key:', error);
      toast.error('Failed to fetch public key');
    }
  };

  const fetchTokenPrice = async (asset) => {
    try {
      const response = await axios.post('http://localhost:3009/fetch-token-price', {
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
      const response = await axios.post(`http://localhost:3009/get-balances`, {
        publicKey: publicKey,
      });
      
      const balances = response.data.balances.reduce((acc, balance) => {
        if (balance.assetCode) {
          acc[balance.assetCode] = balance.balance;
        } else {
          acc['DIAM'] = balance.balance; // Assuming 'native' balance represents DIAM
        }
        return acc;
      }, {});
  
      setAccountBalances(balances);
    } catch (error) {
      console.error('Error fetching account balances:', error);
      toast.error('Failed to fetch account balances');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: userSecret,
      });

      setUserPublicKeyLocal(response.data.publicKey); // Update local state
      setUserPublicKey(response.data.publicKey); // Pass to parent component
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

  const handleSwap = () => {
    setShowConfirmation(true); // Display confirmation dialog
  };

  const confirmSwap = async () => {
    setIsProcessing(true); // Set processing state to true while transaction is being processed

    try {
      const endpoint = isTradeForDiam ? 'trade-for-DIAM' : 'trade-for-assets';
      const response = await axios.post(`http://localhost:3009/${endpoint}`, {
        UserSecret: userSecret,
        amount: amount,
        asset: asset,
      });

      setTransactionID(response.data.transactionID || response.data.transactionHashes.assetSend);
      toast.success('Trade successful');
    } catch (error) {
      console.error('Error trading:', error);
      toast.error('Trade failed');
    } finally {
      setIsProcessing(false); // Set processing state back to false after transaction attempt
      setShowConfirmation(false); // Hide confirmation dialog after transaction attempt
    }
  };

  const formatCurrentPrice = () => {
    if (isTradeForDiam) {
      return `${amount} ${asset} for ${(amount / tokenPrice).toFixed(2)} DIAM`;
    } else {
      return `${amount} DIAM for ${(amount * tokenPrice).toFixed(2)} ${asset}`;
    }
  };


  return (
    <>
    
        {loggedIn && (
          <div className="tradeBox">
            <div className="tradeBoxHeader">
            <div className="onlineCircle"></div>
              <p>{userPublicKey.slice(0, 15)}....</p>
            </div>
            <div>
              <div className='radio-inputs'>
                <label className="radio">
                <input
                  type="radio"
                  name="radio"
                  checked={isTradeForDiam}
                  onChange={() => setIsTradeForDiam(true)}
                />
                <span class="name">Trade for DIAM</span>
              </label >
              <label className="radio">
                <input
                  type="radio"
                  name="radio"
                  checked={!isTradeForDiam}
                  onChange={() => setIsTradeForDiam(false)}
                />
               <span class="name">Trade for Assets</span> 
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
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className='Dropdown'
                >
                  <option value="TestBTC">BTC</option>
                  <option value="TestETH">ETH</option>
                  <option value="TestDOGE">DOGE</option>
                </select>
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
                  <p className='assetTwoText'>
                    You will receive: {receiveAmount.toFixed(2)}{' '}
                    {isTradeForDiam ? 'DIAM' : asset}
                  </p>
                </div>
              </div>
            </div>
            <div className="accountBalances">
              <h3>Account Balances</h3>
              
                <p>{asset}: {accountBalances[asset] || 'Loading...'}</p>
                <p>DIAM: {accountBalances['DIAM'] || 'Loading...'}</p>
                {/* Add additional asset balances here */}
             
            </div>
            
        {transactionID && (
          <div className='trasactionID'>
            <p>Transaction ID: {transactionID}</p>
            <a
              href={`https://testnetexplorer.diamcircle.io/`}
              target="_blank"
              rel="noopener noreferrer"
              className='ViewTestNet'
            >
              View Testnet Explorer
            </a>
            
          </div>
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

export default Swap;
