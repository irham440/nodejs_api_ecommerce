const {getProducts, pembelian, notificationBeli} = require('../services/produk');
const snap = require('../config/snap');

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

const handlePembelian = async(req, res, next) => {
    try {
        const {productId, jumlah, metode} = req.body;
        const userId = req.user.id;
        // Logika pembelian produk, misalnya memeriksa stok, mengurangi saldo pengguna, dll.
        // Misalnya:
        if (metode === "saldo") {
            const result = await pembelian({userId, productId, jumlah});
            res.status(200).json({success: true, message: "berhasil membeli produk", data:result});

        } else if (metode === "midtrans") {   
            const result = await notificationBeli({userId, productId, jumlah});
            res.status(200).json({success: true, message: "berhasil membeli produk dengan midtrans", data: result});
        } else {
            return res.status(400).json({success: false, message: "metode pembayaran tidak valid"});
        }
    } catch (err) {
        next(err)
    }
}

module.exports = {produkHandler, handlePembelian};