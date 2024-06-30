import DiamSdk from 'diamante-sdk-js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3009;

app.use(bodyParser.json());
app.use(cors());

const server = new DiamSdk.Horizon.Server('https://diamtestnet.diamcircle.io/');

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

const getBalances = async (req, res) => {
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
};
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
app.listen(port, () => {
    console.log(`Diamante backend listening at http://localhost:${port}`);
});
