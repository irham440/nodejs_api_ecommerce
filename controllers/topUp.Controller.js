const {notificationTopup} = require('../services/topUp');

const handelTopUp = async(req, res, next) => {
    try {
        const {amount} = req.body;
        const {id} = req.user;
        const idUser = Number(id);
        const result = await notificationTopup({idUser, amount: Number(amount)});
        res.status(200).json({message: "berhasil melakukan top-up", result});
    } catch (err) {
        next(err)
    }
}

module.exports = handelTopUp;