import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AssetTrading = () => {
  const [userSecret, setUserSecret] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('TestBTC');
  const [userPublicKey, setUserPublicKey] = useState('');
  const [transactionID, setTransactionID] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

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

  const fetchUserPublicKey = async (secret) => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: secret,
      });

      console.log('Login successful:', response.data);
      setUserPublicKey(response.data.publicKey);
      toast.success('Login successful');
    } catch (error) {
      console.error('Error fetching public key:', error);
      toast.error('Failed to fetch public key');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: userSecret,
      });

      console.log('Login successful:', response.data);
      setUserPublicKey(response.data.publicKey);
      setLoggedIn(true);

      if (keepLoggedIn) {
        localStorage.setItem('userSecret', userSecret);
        localStorage.setItem('keepLoggedIn', 'true');
      } else {
        sessionStorage.setItem('userSecret', userSecret);
        sessionStorage.setItem('keepLoggedIn', 'true');
      }

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

  const handleTradeForDIAM = async () => {
    try {
      const response = await axios.post('http://localhost:3009/trade-for-DIAM', {
        UserSecret: userSecret,
        amount: amount,
        asset: asset,
      });

      console.log('Trade successful:', response.data);
      setTransactionID(response.data.transactionHashes.assetSend);
      toast.success('Trade successful');
    } catch (error) {
      console.error('Error trading for DIAM:', error);
      toast.error('Trade failed');
    }
  };

  const handleTradeForAssets = async () => {
    try {
      const response = await axios.post('http://localhost:3009/trade-for-assets', {
        UserSecret: userSecret,
        amount: amount,
        asset: asset,
      });

      console.log('Trade successful:', response.data);
      setTransactionID(response.data.transactionID);
      toast.success('Trade successful');
    } catch (error) {
      console.error('Error trading for assets:', error);
      toast.error('Trade failed');
    }
  };

  return (
    <div>
      <h1>Asset Trading</h1>
      {!loggedIn ? (
        <div>
          <input type="text" value={userSecret} onChange={(e) => setUserSecret(e.target.value)} placeholder="User Secret" />
          <label>
            Keep me logged in
            <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} />
          </label>
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <p>Your Public Key: {userPublicKey}</p>
          <button onClick={handleLogout}>Logout</button>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
          <select value={asset} onChange={(e) => setAsset(e.target.value)}>
            <option value="TestBTC">BTC</option>
            <option value="TestETH">ETH</option>
            <option value="TestDOGE">DOGE</option>
          </select>
          <button onClick={handleTradeForDIAM}>Trade Assets for DIAM</button>
          <button onClick={handleTradeForAssets}>Trade DIAM for Assets</button>
        </div>
      )}

      {transactionID && (
        <div>
          <p>Transaction ID: {transactionID}</p>
          <a href={`https://testnetexplorer.diamcircle.io/`} target="_blank" rel="noopener noreferrer">View Testnet Explorer</a>
          <p>Note: To view your transaction on the testnet , click on the above link and paste your transaction ID.</p>
        </div>
      )}
    </div>
  );
};

export default AssetTrading;
