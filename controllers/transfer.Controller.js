const {transfer} = require("../services/transfer");

const handelTransfer = async(req, res, next) => {
    try {
        const senderId = req.params.id;
        console.log(senderId)
        const {receiverPhone, amount} = req.body;
        console.log(receiverPhone,"    ", amount)
        const result = await transfer({senderId: Number(senderId), receiverPhone, amount: Number(amount)});
        res.status(200).json({success: true, message: "berhasil membuat transaksi", result});
    } catch (err) {
        next(err)
    }
}

module.exports = handelTransfer;