import React, { useState } from 'react';
import axios from 'axios';
import './Product.css';
import Dia from '../dia.webp';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function Product({ userPublicKey }) {
  const items = [
    {
      label: 'DIAM',
      key: 'DIAM',
      icon: <img src={Dia} alt="DIAM" style={{ width: '20px', height: '20px' }} />,
    }
  ];

  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState(items[0].key);
  const [receiveAmount, setReceiveAmount] = useState(0);

  const handleMenuClick = (e) => {
    setAsset(e.key);
  };

  const calculateReceiveAmount = (amount) => {
    return amount / 20;  // Update the logic as needed
  };

  const paymentHandler = async (e) => {
    e.preventDefault();

    if (!userPublicKey) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3009/order", {
        amount: amount * 100,
        currency: 'INR',
        receipt: 'qwsaq1',
      });

      const order = response.data;
      console.log(order);

      var options = {
        key: "rzp_test_goQdXjPF8Zv1kQ",
        amount: amount * 100,
        currency: 'INR',
        name: "AUXO",
        description: "Test Transaction",
        image: "/logoTrans.png",
        order_id: order.id,
        handler: async function (response) {
            const body = {
              ...response,
              publicKey: userPublicKey,
              amount 
            };

            const validateRes = await axios.post("http://localhost:3009/order/validate", body);
            const jsonRes = validateRes.data;

            console.log(jsonRes);
            if (jsonRes.msg === "success") {
              try{
              console.log(amount, userPublicKey, jsonRes.paymentId);
              const swapResponse = await axios.post("https://auxo-crypto-exchange.onrender.com/fiat-to-diam", {publicKey: userPublicKey,
                amount,
                payment_id: jsonRes.paymentId});
              const swapRes = swapResponse.data;
              console.log(swapRes);
              toast.success("Payment successful");
              toast.success(`Head over to your wallet to see the newly transferred ${amount/20} DIAM !`);
              }
              catch(err){
                console.log(err);
              }
            }
          },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#000000",
        },
      };

      var rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        alert(response.error.description);
      });

      rzp1.open();
    } catch (error) {
      console.error("Error creating order: ", error);
    }
  };

  return (
    userPublicKey ? (
      <div className="product">
        <div className="inputs">
          <label> Amount : </label>
          <input
            className="texting"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setReceiveAmount(calculateReceiveAmount(e.target.value));
            }}
            placeholder="Amount in INR"
          />
          <Dropdown overlay={
            <Menu onClick={handleMenuClick}>
              {items.map(item => (
                <Menu.Item key={item.key} icon={item.icon}>
                  {item.label}
                </Menu.Item>
              ))}
            </Menu>
          }>
            <button className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              {items.find(item => item.key === asset)?.icon}
              <span className="text-cont">{items.find(item => item.key === asset)?.label}</span>
              <DownOutlined />
            </button>
          </Dropdown>
        </div>
        <p>You will receive {receiveAmount} DIAM</p>
        <button onClick={paymentHandler}>Pay</button>
      </div>
    ) : (
      <div>Please connect your wallet to make a payment.</div>
    )
  );
}

export default Product;
