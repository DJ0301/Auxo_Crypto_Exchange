const fetchUserPublicKey = async (secret) => {
  try {
    const response = await axios.post('http://localhost:3009/login', {
      UserSecret: secret,
    });

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

    setUserPublicKey(response.data.publicKey);
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