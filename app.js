
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('./middlewires/error.middlewire');
const {createUser, loginUser} = require('./controllers/user.controller');
const handleTopUp = require('./controllers/topUp.Controller');
const rateLimit = require('./utils/counter')
const handleMidtransNotification = require('./controllers/callback.Controller');
const app = express();
const port = process.env.PORT;
app.use(express.json())
app.use(bodyParser.json())
app.use(cors());




// Route untuk buat pembayaran
app.post('/top-up', handleTopUp);
app.post('/midtrans-notification', handleMidtransNotification);

// Route untuk user
app.post("/user", createUser);
app.post("/login", rateLimit({maxRequest: 3, windowSecond: 120, keyPrefix: "login"}),loginUser);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
})
