import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AssetTrading = () => {
  const [userSecret, setUserSecret] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('TestBTC');
  const [userPublicKey, setUserPublicKey] = useState('');
  const [transactionID, setTransactionID] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3009/login', {
        UserSecret: userSecret,
      });

      console.log('Login successful:', response.data);
      setUserPublicKey(response.data.publicKey);
      setLoggedIn(true);
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
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <p>User's Public Key: {userPublicKey}</p>
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
        </div>
      )}
    </div>
  );
};

export default AssetTrading;
