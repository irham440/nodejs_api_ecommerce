const {getProducts, pembelian, notificationBeli, pay, getOrder} = require('../services/produk');
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
        const {productId, jumlah } = req.body;
        const userId = req.user.id;
        const result = await pembelian({userId, productId, jumlah});
        res.status(200).json({success: true, message: "berhasil membeli produk", data: result});
    } catch (err) {
        next(err)
    }
}
const handlePay = async(req, res, next) => {
    try {
        const {orderId} = req.body;
        const result = await pay({orderId: Number(orderId)});
        res.status(200).json({success: true, message: "berhasil melakukan pembayaran", data: result});
    } catch (err) {
        next(err)
    }
}
const pesananHandler = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await getOrder({userId: Number(userId)});
        res.status(200).json({success: true, message: "berhasil mengambil data pesanan", data: result});
    } catch (err) {
        next(err)
    }
}

module.exports = {produkHandler, handlePembelian, handlePay, pesananHandler};