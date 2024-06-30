import axios from 'axios';

const tradeForDIAM = async (userSecret, asset, amount) => {
  try {
    const response = await axios.post('http://localhost:3009/trade-for-DIAM', {
      UserSecret: userSecret,
      amount: amount,
      asset: asset,
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error trading for DIAM:', error);
    throw error;
  }
};

const tradeForAssets = async (userSecret, asset,amount) => {
  try {
    const response = await axios.post('http://localhost:3009/trade-for-assets', {
      UserSecret: userSecret,
      amount: amount,
      asset: asset,
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error trading for assets:', error);
    throw error;
  }
};