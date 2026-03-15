const {getProducts} = require('../services/produk');

const produkHandler = async(req, res, next) => {
    try {
        const {nama, min_price, max_price, sort} = req.query;
        const result = await getProducts({nama, min_price: Number(min_price), max_price: Number(max_price)}, sort);
        if(result.length === 0){
            return res.status(404).json({success: false, message: "produk tidak ditemukan"})
        }
        res.status(200).json({success: true, message: "berhasil mengambil data produk", data: result})
    } catch (err) {
        next(err)
    }
}

module.exports = {produkHandler};