import DiamSdk from 'diamante-sdk-js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import Razorpay from 'razorpay'
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3009;

app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.post("/order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = req.body;
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Error");
    }

    const payments = await razorpay.payments.all({ order_id: order.id });

    if (payments.items.length === 0) {
      return res.status(500).send("No payment found for the order");
    }

    const paymentId = payments.items[0].id;

    res.json({ ...order, payment_id: paymentId });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});

const server = new DiamSdk.Horizon.Server('https://diamtestnet.diamcircle.io/');

const DIAM_RATE = {
    'TestBTC': 1, // 1 DIAM = 1 BTC
    'TestETH': 3, // 1 DIAM = 3 ETH
    'TestDOGE': 5, // 1 DIAM = 5 DOGE
    'DIAM': 1
};

const tradeforDIAM = async (req, res) => {
    try {
        const { UserSecret, amount, asset } = req.body;
        let rate = DIAM_RATE[asset];
        console.log(`rate for ${asset}: ${rate}`);
        let assetSecret = '';

        // Asset secret setup (similar to existing code)
        if (asset === 'TestBTC') {
            assetSecret = "SAH53BF3S5ERGZLKG5FJIP4AYE7KPDP7CNY67DOSUHVZW7YG2FGZPGJH";
        } else if (asset === 'TestETH') {
            assetSecret = "SAQXHIHSY57M3Q5L3Q7ZPEHZYFGEV5WMZDQCQJTZDS24PBAOSBO75OR3";
        } else if (asset === 'TestDOGE') {
            assetSecret = "SDDFMV4IYDT5TPEI6QVOX3SFPWOS2JITMASYIA7Y23YTH27EU3BXZQNC";
        } else {
            return res.status(400).json({ message: 'Invalid asset' });
        }

        // Console log for debugging purposes
        console.log(`assetSecret: ${assetSecret}, UserSecret: ${UserSecret}, amount: ${amount}`);

        // Initialize Keypair objects for asset and user accounts
        const AssetAccount = DiamSdk.Keypair.fromSecret(assetSecret);
        const UserAccount = DiamSdk.Keypair.fromSecret(UserSecret);

        // Define asset objects for different types (TestBTC, TestETH, TestDOGE)
        const TestBTC = new DiamSdk.Asset('TestBTC', 'GD6ZQJAJDCKCOGB3MK2WVJIOLYWP4AWYZ3SDOFIAVUTSE3QVEDZDKTY6');
        const TestETH = new DiamSdk.Asset('TestETH', 'GDBJMYAYPDAA7CUQAXEJMIWBIR2WMQGGKWRLAVY434BGGW7TGJRT3R7N');
        const TestDOGE = new DiamSdk.Asset('TestDOGE', 'GCHR5OL2ITYGXNUF5T5J5NKTYLK5ESEBWUSY3N5MRGE2CNB3EZKDQOKS');
        
        let assetObj = asset === 'TestBTC' ? TestBTC : asset === 'TestETH' ? TestETH : TestDOGE;

        // Set up the trustline from asset issuer to user account if not already set
        const assetIssuerAccount = await server.loadAccount(AssetAccount.publicKey());
        if (!assetIssuerAccount.balances.some(b => b.asset_code === assetObj.code && b.asset_issuer === assetObj.issuer)) {
            const trustlineTransaction = new DiamSdk.TransactionBuilder(assetIssuerAccount, {
                fee: await server.fetchBaseFee(),
                networkPassphrase: DiamSdk.Networks.TESTNET,
            })
                .addOperation(
                    DiamSdk.Operation.changeTrust({
                        asset: assetObj,
                        limit: '100000',
                    })
                )
                .setTimeout(100)
                .build();

            trustlineTransaction.sign(AssetAccount);
            await server.submitTransaction(trustlineTransaction);
            console.log(`Trustline Set`);
        }

        // Send asset from user to asset issuer
        const userAccount = await server.loadAccount(UserAccount.publicKey());
        const sendAssetTransaction = new DiamSdk.TransactionBuilder(userAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: AssetAccount.publicKey(),
                    asset: assetObj,
                    amount: amount,
                })
            )
            .setTimeout(100)
            .build();

        sendAssetTransaction.sign(UserAccount);
        const sendAssetResult = await server.submitTransaction(sendAssetTransaction);
        const sendAssetTxHash = sendAssetResult.hash; // Get transaction hash

        console.log(`Asset Sent. Sender: ${UserAccount.publicKey()}, Receiver: ${AssetAccount.publicKey()}, Amount: ${amount}`);

        // Send DIAM from asset issuer to user
        const issuingAccount = await server.loadAccount(AssetAccount.publicKey());
        const sendDIAMTransaction = new DiamSdk.TransactionBuilder(issuingAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: UserAccount.publicKey(),
                    asset: DiamSdk.Asset.native(),
                    amount: (parseFloat(amount) / parseFloat(rate)).toFixed(7).toString()
                })
            )
            .setTimeout(100)
            .build();

        sendDIAMTransaction.sign(AssetAccount);
        const sendDIAMResult = await server.submitTransaction(sendDIAMTransaction);
        const sendDIAMTxHash = sendDIAMResult.hash; // Get transaction hash

        console.log(`DIAM Sent. Sender: ${AssetAccount.publicKey()}, Receiver: ${UserAccount.publicKey()}, Asset: ${asset}`);

        // Respond with enhanced JSON including transaction hashes
        res.json({
            message: 'Trustline set, and assets exchanged successfully',
            AssetIssuer: {
                publicKey: AssetAccount.publicKey(),  
            },
            User: {
                publicKey: UserAccount.publicKey(),
            },
            asset: asset,
            assetAmount: amount,
            diamAmount: (parseFloat(amount) / parseFloat(rate)).toFixed(7).toString(),
            transactionHashes: {
                assetSend: sendAssetTxHash,
                diamSend: sendDIAMTxHash
            }
        });
    } catch (error) {
        console.error(`Error in trade-asset-to-diam :`, error);
        res.status(500).json({ error: error.message });
    }
};

const tradeforAssets = async (req, res) => {
    try {
        const { UserSecret, amount, asset } = req.body;
        let rate = DIAM_RATE[asset];
        console.log(`rate for ${asset}: ${rate}`);
        let assetSecret = '';

        // Asset secret setup (similar to existing code)
        if (asset === 'TestBTC') {
            assetSecret = "SAH53BF3S5ERGZLKG5FJIP4AYE7KPDP7CNY67DOSUHVZW7YG2FGZPGJH";
        } else if (asset === 'TestETH') {
            assetSecret = "SAQXHIHSY57M3Q5L3Q7ZPEHZYFGEV5WMZDQCQJTZDS24PBAOSBO75OR3";
        } else if (asset === 'TestDOGE') {
            assetSecret = "SDDFMV4IYDT5TPEI6QVOX3SFPWOS2JITMASYIA7Y23YTH27EU3BXZQNC";
        } else {
            return res.status(400).json({ message: 'Invalid asset' });
        }

        // Console log for debugging purposes
        console.log(`assetSecret: ${assetSecret}, UserSecret: ${UserSecret}, amount: ${amount}`);

        // Initialize Keypair objects for asset and user accounts
        const AssetAccount = DiamSdk.Keypair.fromSecret(assetSecret);
        const UserAccount = DiamSdk.Keypair.fromSecret(UserSecret);

        // Define asset objects for different types (TestBTC, TestETH, TestDOGE)
        const TestBTC = new DiamSdk.Asset('TestBTC', 'GD6ZQJAJDCKCOGB3MK2WVJIOLYWP4AWYZ3SDOFIAVUTSE3QVEDZDKTY6');
        const TestETH = new DiamSdk.Asset('TestETH', 'GDBJMYAYPDAA7CUQAXEJMIWBIR2WMQGGKWRLAVY434BGGW7TGJRT3R7N');
        const TestDOGE = new DiamSdk.Asset('TestDOGE', 'GCHR5OL2ITYGXNUF5T5J5NKTYLK5ESEBWUSY3N5MRGE2CNB3EZKDQOKS');
        
        let assetObj = asset === 'TestBTC' ? TestBTC : asset === 'TestETH' ? TestETH : TestDOGE;

        // Set up the trustline from user to asset issuer (reverse of tradeforDIAM function)
        const userAccount = await server.loadAccount(UserAccount.publicKey());
        if (!userAccount.balances.some(b => b.asset_code === assetObj.code && b.asset_issuer === assetObj.issuer)) {
            const trustlineTransaction = new DiamSdk.TransactionBuilder(userAccount, {
                fee: await server.fetchBaseFee(),
                networkPassphrase: DiamSdk.Networks.TESTNET,
            })
                .addOperation(
                    DiamSdk.Operation.changeTrust({
                        asset: assetObj,
                        limit: '100000',
                    })
                )
                .setTimeout(100)
                .build();

            trustlineTransaction.sign(UserAccount);
            await server.submitTransaction(trustlineTransaction);
            console.log(`Trustline Set`);
        }

        // Send DIAM from user to asset issuer
        const sendingAccount = await server.loadAccount(UserAccount.publicKey());
        const sendDIAMTransaction = new DiamSdk.TransactionBuilder(sendingAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: AssetAccount.publicKey(),
                    asset: DiamSdk.Asset.native(),
                    amount: amount,
                })
            )
            .setTimeout(100)
            .build();

        sendDIAMTransaction.sign(UserAccount);
        const sendDIAMResult = await server.submitTransaction(sendDIAMTransaction);
        const sendDIAMTxHash = sendDIAMResult.hash; // Get transaction hash

        console.log(`DIAM Sent. Sender: ${UserAccount.publicKey()}, Receiver: ${AssetAccount.publicKey()}, Amount: ${amount}`);

        // Send asset from asset issuer to user
        const assetIssuerAccount = await server.loadAccount(AssetAccount.publicKey());
        const sendAssetTransaction = new DiamSdk.TransactionBuilder(assetIssuerAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: UserAccount.publicKey(),
                    asset: assetObj,
                    amount: (parseFloat(amount) * parseFloat(rate)).toFixed(7).toString(),
                })
            )
            .setTimeout(100)
            .build();

        sendAssetTransaction.sign(AssetAccount);
        const sendAssetResult = await server.submitTransaction(sendAssetTransaction);
        const sendAssetTxHash = sendAssetResult.hash; // Get transaction hash

        console.log(`Asset Sent. Sender: ${AssetAccount.publicKey()}, Receiver: ${UserAccount.publicKey()}, Asset: ${asset}`);

        // Respond with enhanced JSON including transaction hashes
        res.json({
            message: 'Trustline set, and assets exchanged successfully',
            AssetIssuer: {
                publicKey: AssetAccount.publicKey(),  
            },
            User: {
                publicKey: UserAccount.publicKey(),
            },
            asset: asset,
            diamAmount: amount,
            assetAmount: (parseFloat(amount) * parseFloat(rate)).toFixed(7).toString(),
            transactionHashes: {
                diamSend: sendDIAMTxHash,
                assetSend: sendAssetTxHash
            }
        });
    } catch (error) {
        console.error(`Error in trade-diam-to-asset`, error);
        res.status(500).json({ error: error.message });
    }
};

const tradeAssets = async (req, res) => {
    try {
    const { UserSecret, amount, SentAsset, ReceivedAsset } = req.body;
    let rate = parseFloat(DIAM_RATE[ReceivedAsset]) / parseFloat(DIAM_RATE[SentAsset]);
    console.log(`rate for this exchange: ${rate}`);
    console.log(`SentAsset: ${SentAsset}, ReceivedAsset: ${ReceivedAsset}, UserSecret: ${UserSecret}, amount: ${amount}`);
    let ReceivedAssetSecret = '';
    if (ReceivedAsset === 'TestBTC') {
        ReceivedAssetSecret = "SAH53BF3S5ERGZLKG5FJIP4AYE7KPDP7CNY67DOSUHVZW7YG2FGZPGJH";
    } else if (ReceivedAsset === 'TestETH') {
        ReceivedAssetSecret = "SAQXHIHSY57M3Q5L3Q7ZPEHZYFGEV5WMZDQCQJTZDS24PBAOSBO75OR3";
    } else if (ReceivedAsset === 'TestDOGE') {
        ReceivedAssetSecret = "SDDFMV4IYDT5TPEI6QVOX3SFPWOS2JITMASYIA7Y23YTH27EU3BXZQNC";
    } else {
        return res.status(400).json({ message: 'Invalid asset' });
    }
    const UserAccount = DiamSdk.Keypair.fromSecret(UserSecret);
    const ReceivedAssetAccount = DiamSdk.Keypair.fromSecret(ReceivedAssetSecret);
    console.log('UserAccount:', UserAccount.publicKey());
    console.log('ReceivedAssetAccount:', ReceivedAssetAccount.publicKey());
    const TestBTC = new DiamSdk.Asset('TestBTC', 'GD6ZQJAJDCKCOGB3MK2WVJIOLYWP4AWYZ3SDOFIAVUTSE3QVEDZDKTY6');
    const TestETH = new DiamSdk.Asset('TestETH', 'GDBJMYAYPDAA7CUQAXEJMIWBIR2WMQGGKWRLAVY434BGGW7TGJRT3R7N');
    const TestDOGE = new DiamSdk.Asset('TestDOGE', 'GCHR5OL2ITYGXNUF5T5J5NKTYLK5ESEBWUSY3N5MRGE2CNB3EZKDQOKS');
    
    let SentAssetObj = SentAsset === 'TestBTC' ? TestBTC : SentAsset === 'TestETH' ? TestETH : TestDOGE;
    let ReceivedAssetObj = ReceivedAsset === 'TestBTC' ? TestBTC : ReceivedAsset === 'TestETH' ? TestETH : TestDOGE;
    // Set up the trustline from asset issuer to user account if not already set
    const receivedAssetAccount = await server.loadAccount(ReceivedAssetAccount.publicKey());
    console.log('ReceivedAssetAccount loaded', ReceivedAssetAccount.publicKey());
    if(!receivedAssetAccount.balances.some(b => b.asset_code === SentAssetObj.code && b.asset_issuer === SentAssetObj.issuer))
        {
        const trustlineTransaction = new DiamSdk.TransactionBuilder(receivedAssetAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.changeTrust({
                    asset: ReceivedAssetObj,
                    limit: '100000',
                })
            )
            .setTimeout(100)
            .build();

        trustlineTransaction.sign(ReceivedAssetAccount);
        await server.submitTransaction(trustlineTransaction);
        console.log(`Trustline transaction hash ${trustlineTransaction.hash}`);
        console.log(`Trustline Set`);
        }
    
    const userAccount = await server.loadAccount(UserAccount.publicKey());
    console.log('UserAccount loaded', UserAccount.publicKey());
        const sendAssetTransaction = new DiamSdk.TransactionBuilder(userAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: ReceivedAssetAccount.publicKey(),
                    asset: SentAssetObj,
                    amount: amount
                })
            )
            .setTimeout(100)
            .build();
        console.log('sendAssetTransaction built');
        sendAssetTransaction.sign(UserAccount);
        console.log('sendAssetTransaction signed');
        const sendAssetResult = await server.submitTransaction(sendAssetTransaction);
        console.log('sendAssetTransaction submitted' + sendAssetResult);
        const sendAssetTxHash = sendAssetResult.hash; // Get transaction hash

        //Send ReceivedAsset from AssetAccount to UserAccount
        const assetIssuerAccount = await server.loadAccount(ReceivedAssetAccount.publicKey());
        const sendReceivedAssetTransaction = new DiamSdk.TransactionBuilder(assetIssuerAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: UserAccount.publicKey(),
                    asset: ReceivedAssetObj,
                    amount: (parseFloat(amount) * parseFloat(rate)).toFixed(7).toString()
                })
            )
            .setTimeout(100)
            .build();
        sendReceivedAssetTransaction.sign(ReceivedAssetAccount);
        const sendReceivedAssetResult = await server.submitTransaction(sendReceivedAssetTransaction);
        const sendReceivedAssetTxHash = sendReceivedAssetResult.hash; // Get transaction hash

        // Respond with enhanced JSON including transaction hashes
        res.json({
            message: 'Trustline set, and assets exchanged successfully',
            AssetIssuer: {
                publicKey: ReceivedAssetAccount.publicKey(),  
            },
            User: {
                publicKey: UserAccount.publicKey(),
            },
            SentAsset: SentAsset,
            ReceivedAsset: ReceivedAsset,
            SentAssetAmount: amount,
            ReceivedAssetAmount: (parseFloat(amount) * parseFloat(rate)).toFixed(7).toString(),
            transactionHashes: {
                SentAssetSend: sendAssetTxHash,
                ReceivedAssetSend: sendReceivedAssetTxHash
            }
        });
    }catch (error) {
        console.error(`Error in trade-assets:`, error);
        res.status(500).json({ error: error.message });
    }
};

async function getBalances(req, res) {
    try {
        const { publicKey } = req.body;
        const account = await server.loadAccount(publicKey);
        const balances = account.balances.map(balance => ({
            assetType: balance.asset_type,
            assetCode: balance.asset_code,
            balance: balance.balance
        }));
        res.json({ publicKey, balances });
    } catch (error) {
        console.error('Error fetching balances:', error);
        res.status(500).json({ error: error.message });
    }
}
const fetchTokenPrice = (req, res) => {
    try {
        const { asset } = req.body;
        const price = DIAM_RATE[asset];

        if (price !== undefined) {
            res.json({
                asset: asset,
                price: price,
            });
        } else {
            res.status(404).json({ error: `Price for asset ${asset} not found` });
        }
    } catch (error) {
        console.error('Error fetching token price:', error);
        res.status(500).json({ error: error.message });
    }
};
const login = async (req, res) => {
    try {
        const { UserSecret } = req.body;
        const userAccount = DiamSdk.Keypair.fromSecret(UserSecret);
        res.json({
            publicKey: userAccount.publicKey(),
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: error.message });
    }
};

const generateAccount = async () => {
    try {
        const keypair = DiamSdk.Keypair.random();
        const fundAccount = async (publicKey) => {
            const fetch = await import('node-fetch').then(mod => mod.default);
            const response = await fetch(`https://friendbot.diamcircle.io/?addr=${publicKey}`);
            if (!response.ok) {
                throw new Error(`Failed to activate account ${publicKey}: ${response.statusText}`);
            }
            return response.json();
        };

        await Promise.all([
            fundAccount(keypair.publicKey()),
        ]);
        console.log('Generated account:', keypair.publicKey());
        return {
            publicKey: keypair.publicKey(),
            secretKey: keypair.secret(),
        };
        
    } catch (error) {
        console.error('Error generating account:', error);
        throw error;
    }
};

// Register endpoint to create a new account and return public key and secret
const register = async (req, res) => {
    try {
        const { publicKey, secretKey } = await generateAccount();
        res.json({
            publicKey: publicKey,
            secretKey: secretKey,
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: error.message });
    }
};

const fiatToDIAM = async (req, res) => {
    try {
        const { amount, payment_id, publicKey } = req.body;

        // Validate input
        if (!amount || !payment_id || !publicKey) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Convert amount to string and ensure it has 7 decimal places
        const formattedAmount = parseFloat(amount/20).toFixed(7);

        // Create a transaction to send DIAM
        const fiatSecret = 'SDAEE64IXF4WPY3ZF3LRWD7QRHZ5TOZLVY4ISAE6LTEULNKBUEGHPF3B'; // Replace with the secret key of the account holding the DIAM for fiat transactions
        const sourceKeypair = DiamSdk.Keypair.fromSecret(fiatSecret);
        const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

        const transaction = new DiamSdk.TransactionBuilder(sourceAccount, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: DiamSdk.Networks.TESTNET,
        })
            .addOperation(
                DiamSdk.Operation.payment({
                    destination: publicKey,
                    asset: DiamSdk.Asset.native(), // DIAM
                    amount: formattedAmount,
                })
            )
            .addMemo(DiamSdk.Memo.text(payment_id))
            .setTimeout(100)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);

        res.json({
            message: 'DIAM sent successfully',
            amount: formattedAmount,
            payment_id: payment_id,
            recipient: publicKey,
            transactionHash: result.hash,
        });

    } catch (error) {
        console.error('Error in fiatToDIAM:', error);
        res.status(500).json({ error: error.message });
    }
};

app.post('/fiat-to-diam', (req, res) => {
    fiatToDIAM(req, res);
});

app.post('/login', (req, res) => {
    login(req, res);
});

app.post('/trade-for-DIAM', (req, res) => {
    tradeforDIAM(req, res);
});

app.post('/trade-for-assets', (req, res) => {
    tradeforAssets(req, res);
});

app.post('/get-balances', (req, res) => {
    getBalances(req, res);
});
app.post('/fetch-token-price', (req,res) => {
    fetchTokenPrice(req,res);
});
app.post('/trade-assets', (req, res) => {
    tradeAssets(req, res);
});
app.post('/register', (req, res) => {
    register(req, res);
});
app.listen(port, () => {
    console.log(`Diamante backend listening at http://localhost:${port}`);
});
