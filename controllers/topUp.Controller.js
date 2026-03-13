const notificationTopup = require('../services/topUp');

const handelTopUp = async(req, res, next) => {
    try {
        const {idUser, amount} = req.body;
        const result = await notificationTopup({idUser, amount: Number(amount)});
        res.status(200).json({message: "berhasil melakukan top-up", result});
    } catch (err) {
        next(err)
    }
}

module.exports = handelTopUp;