const top = require('../services/checkOut');

const handelCheckOut = async(req, res, next) => {
    try {
        const {idUser, amount} = req.body;
        const result = await top({idUser, amount: Number(amount)});
        res.status(200).json({message: "berhasil melakukan checkout", result});
    } catch (err) {
        next(err)
    }
}

module.exports = handelCheckOut;