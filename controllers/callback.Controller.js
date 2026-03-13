const snap = require('../config/snap');
const topUp = require('../services/topUp')

const handleMidtransNotification = async (req, res, next) => {
    try {
        const statusResponse = await snap.transaction.notification(req.body);
        
  
        const metadata = statusResponse.metadata || {}; 
        const name = metadata.name;
        const status = statusResponse.transaction_status;
        console.log(`Pesan masuk: Order ${statusResponse.order_id} statusnya ${status}`);
        console.log(name)

        if (status === 'settlement' && name === 'Top-up') {
            const idUser = metadata.idUser;
            const amount = metadata.price;
            console.log(idUser,"   ", amount);
            
            const result = await topUp({idUser: Number(idUser), amount: Number(amount)});

            // Kirim respon dan BERHENTI (return)
            return res.status(200).json({ message: "Transfer berhasil", result });
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