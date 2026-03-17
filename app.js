
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('./middlewires/error.middlewire');
const {registerHandler, loginHandler, profileHandler, updateHandler} = require('./controllers/user.controller');
const handleTopUp = require('./controllers/topUp.Controller');
const handleTransfer = require('./controllers/transfer.Controller');
const {produkHandler, handlePembelian, handlePay, pesananHandler} = require('./controllers/produk.Controller'); 
const rateLimit = require('./utils/counter')
const {authMiddlewire} = require('./middlewires/authMiddlewire');
const handleMidtransNotification = require('./controllers/callback.Controller');
const app = express();
const port = process.env.PORT;
app.use(express.json())
app.use(bodyParser.json())
app.use(cors());




// Route untuk buat pembayaran
app.post("/top-up",authMiddlewire, handleTopUp);
app.post("/midtrans-notification", handleMidtransNotification);
app.post("/transfer",authMiddlewire, handleTransfer);

// Route untuk produk
app.get("/products", produkHandler);
app.post("/order",authMiddlewire, handlePembelian);
app.post("/pay", handlePay);
app.get("/pesanan", authMiddlewire, pesananHandler);

// Route untuk user
app.post("/register", registerHandler);
app.post("/login", rateLimit({maxRequest: 3, windowSecond: 120, keyPrefix: "login"}),loginHandler);
app.get("/profile", authMiddlewire, profileHandler);
app.post("/update", authMiddlewire, updateHandler)
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
})
