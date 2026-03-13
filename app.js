
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const snap = require('./config/snap');
const errorHandler = require('./middlewires/error.middlewire');
const {createUser, loginUser} = require('./controllers/user.controller');
const handleTransfer = require('./controllers/topUp.Controller');
const rateLimit = require('./utils/counter')
const handleMidtransNotification = require('./controllers/callback.Controller');
const app = express();
const port = process.env.PORT;
app.use(express.json())
app.use(bodyParser.json())
app.use(cors());




// Route untuk buat pembayaran
app.post('/checkout', handleTransfer);
app.post('/midtrans-notification', handleMidtransNotification);
app.get("/p", (req, res) => {
    res.send("hello world")
})
app.post("/user", createUser);
app.post("/login", rateLimit({maxRequest: 3, windowSecond: 120, keyPrefix: "login"}),loginUser);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
})
