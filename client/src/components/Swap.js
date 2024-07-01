import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message, Menu, Dropdown } from "antd";
import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// Tsting imports
import { toast } from 'react-toastify';
// End of testing import

function Swap(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  });
  const [swapButtonText, setSwapButtonText] = useState("To Diamante");
  const [swapText, setSwapText] = useState("To Diamante");
  const navigate = useNavigate();

  // Start of const testing 
  const [userSecret, setUserSecret] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('TestBTC');
  const [userPublicKey, setUserPublicKey] = useState('');
  const [transactionID, setTransactionID] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  
  // End of const testing

  useEffect(() => {

    // testing start
    const storedUserSecret = localStorage.getItem('userSecret');
    const storedKeepLoggedIn = localStorage.getItem('keepLoggedIn');

    if (storedUserSecret && storedKeepLoggedIn === 'true') {
      setUserSecret(storedUserSecret);
      setLoggedIn(true);
      setKeepLoggedIn(true);
      fetchUserPublicKey(storedUserSecret); // Fetch user's public key if already logged in
    }
    // testing ends
    fetchPrices(tokenOne.address, tokenTwo.address);
  }, []);


  // Main Testing Functions Starts
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
        asset: asset, // Use the dynamic asset state
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
        asset: asset, // Use the dynamic asset state
      });
  
      console.log('Trade successful:', response.data);
      setTransactionID(response.data.transactionID);
      toast.success('Trade successful');
    } catch (error) {
      console.error('Error trading for assets:', error);
      toast.error('Trade failed');
    }
  };


  const handleSelectChange = (e) => {
    const selectedTicker = e.target.value;
    const selectedToken = tokenList.find(token => token.ticker === selectedTicker);
    const tokenIndex = tokenList.indexOf(selectedToken);
    modifyToken(tokenIndex);
  };

  // End of Main Testing Functions 

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }
// TESTINF MODIFYTOKENS
function modifyToken(index) {
  setPrices(null);
  setTokenOneAmount(null);
  setTokenTwoAmount(null);
  const selectedToken = tokenList[index];

  if (changeToken === 1) {
    setTokenOne(tokenList[index]);
    fetchPrices(tokenList[index].address, tokenTwo.address);
  } else {
    setTokenTwo(tokenList[index]);
    fetchPrices(tokenOne.address, tokenList[index].address);
  }
  setAsset(selectedToken.ticker); // Set asset ticker here
  setIsOpen(false);
}


// END OF TESTING MODIFYTOKENS

  // function modifyToken(i) {
  //   setPrices(null);
  //   setTokenOneAmount(null);
  //   setTokenTwoAmount(null);
  //   if (changeToken === 1) {
  //     setTokenOne(tokenList[i]);
  //     fetchPrices(tokenList[i].address, tokenTwo.address);
  //   } else {
  //     setTokenTwo(tokenList[i]);
  //     fetchPrices(tokenOne.address, tokenList[i].address);
  //   }
  //   setIsOpen(false);
  // }

  async function fetchPrices(one, two) {
    try {
      const res = await axios.get("http://localhost:3001/tokenPrice", {
        params: { addressOne: one, addressTwo: two },
      });
      setPrices(res.data);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  const handleMenuClick = (e) => {
    if (e.key === "switch") {
      switchTokens();
      setSwapButtonText("To Diamante");
      setSwapText("To Diamante");
    } else if (e.key === "other") {
      navigate("/to-other");
    } else if (e.key === "diamante") {
      setSwapButtonText("To Diamante");
      setSwapText("To Diamante");
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="switch">To Diamante</Menu.Item>
      <Menu.Item key="other">To Others</Menu.Item>
    </Menu>
  );

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={(e) => setSlippage(e.target.value)}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      {contextHolder}
      <Modal
        visible={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {/* testing */}
        {tokenList.map((token, index) => (
          <div
            className="tokenChoice"
            key={index}
            onClick={() => modifyToken(index)}
          >
            <img src={token.img} alt={token.ticker} className="tokenLogo" />
            <div className="tokenChoiceNames">
              <div className="tokenName">{token.name}</div>
              <div className="tokenTicker">{token.ticker}</div>
            </div>
          </div>
        ))}
          {/* end of testing */}

          {/* {tokenList?.map((e, i) => (
            <div className="tokenChoice" key={i} onClick={() => modifyToken(i)}>
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          ))} */}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <Dropdown overlay={menu} trigger={["click"]}>
            <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
              {swapText} <DownOutlined />
            </a>
          </Dropdown>
          
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            
          />
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
        </div>
     
        <div
          className="swapButton"
          onClick={handleTradeForDIAM}
        >
          {swapButtonText === "To Diamante" && "Convert"}
        </div>
        <p className="bg-white">Your Public Key: {userPublicKey}</p>
      </div>
    </>
  );
}

export default Swap;
