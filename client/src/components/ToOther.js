import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message, Menu, Dropdown } from "antd";
import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ToOther(props) {
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
  const [swapButtonText, setSwapButtonText] = useState("To Selected");
  const [swapText, setSwapText] = useState("To Others");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrices(tokenOne.address, tokenTwo.address);
  }, []);

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

  function modifyToken(i) {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address);
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two) {
    try {
      const res = await axios.get(`http://localhost:3001/tokenPrice`, {
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
      setSwapButtonText("To Selected");
      setSwapText("To Others");
    } else if (e.key === "diamante") {
      navigate("/");
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="diamante">To Diamante</Menu.Item>
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
          {tokenList?.map((e, i) => (
            <div
              className="tokenChoice"
              key={i}
              onClick={() => modifyToken(i)}
            >
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          ))}
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
            placeholder="Enter Dimante"
            onChange={(e) => setTokenOneAmount(e.target.value)}
            disabled={prices}
          />
         
        </div>
        <div>
            <img src="" alt="" />
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            onChange={(e) => setTokenOneAmount(e.target.value)}
            disabled={prices}
          />
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
        </div>
     
        <div
          className="swapButton"
          disabled={!tokenOneAmount || !isConnected}
          onClick={null}
        >
          {swapButtonText === "To Diamante" && "Convert"}
          {swapButtonText === "To Selected" && "Convert"}
        </div>
      </div>
    </>
  );
}
