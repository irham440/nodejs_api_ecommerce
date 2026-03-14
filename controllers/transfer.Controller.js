const {transfer} = require("../services/transfer");

const handelTransfer = async(req, res, next) => {
    try {
        const senderId = req.user.id;
        const {receiverPhone, amount} = req.body;
        const result = await transfer({senderId: Number(senderId), receiverPhone, amount: Number(amount)});
        res.status(200).json({success: true, message: "Transfer berhasil", result});
    } catch (err) {
        next(err)
    }
}

module.exports = handelTransfer;