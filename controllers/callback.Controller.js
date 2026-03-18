const snap = require('../config/snap');
const pool = require('../config/db');
const {topUp} = require('../services/topUp')

const handleMidtransNotification = async (req, res, next) => {
    try {
        const statusResponse = await snap.transaction.notification(req.body);
        
  
        const metadata = statusResponse.metadata || {}; 
        const name = metadata.name;
        const status = statusResponse.transaction_status;
        console.log(`Pesan masuk: Order ${statusResponse.order_id} statusnya ${status}`);
        console.log('metadata:', metadata)

        if (status === 'settlement' && name === 'Top-up') {
            const idUser = metadata.idUser;
            const amount = metadata.price;
            console.log(idUser,"   ", amount);
            
            const result = await topUp({idUser: Number(idUser), amount: Number(amount)});
            const {saldo, nama} = result;
            console.log('topUp result:', result)
            return res.status(200).json({ success: true, message: "Transfer berhasil", data: {idUser, nama, saldo} });
        } 
        if (status === 'settlement' && name === 'bayar-produk') {
            const userId = metadata.userId;
            const productId = metadata.productId;
            const jumlah = metadata.quantity;
            const updateStock = await pool.query(
                'UPDATE produk SET stock = stock - $1 WHERE id = $2 RETURNING stock',
                [jumlah, productId]
            );
            console.log(`Pembayaran produk berhasil: User ID ${userId}, Product ID ${productId}, Jumlah ${jumlah}`);
            console.log(`Pembayaran produk berhasil: ${statusResponse.order_id}`);
            return res.status(200).send('Pembayaran produk berhasil');
        }
        if (status === 'pending') {
            console.log(`⏳ Menunggu pembayaran: ${statusResponse.order_id}`);
            return res.status(200).send('Pending OK');
        }

        return res.status(200).send('OK');

    } catch (err) {
        next(err);
        if (!res.headersSent) {
            return res.status(500).send(err.message);
        }   
    }
};

module.exports = handleMidtransNotification;