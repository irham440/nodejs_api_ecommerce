const pool = require('../config/db');
const snap = require('../config/snap');
const getProducts = async ({nama, min_price, max_price}, sort) => {
    try {
        const orderBy = sort === "desc" ? "price DESC" : "price ASC";
        const result = await pool.query(`SELECT id, name, price, stock FROM produk WHERE ($1::VARCHAR IS NULL OR name ILIKE $1) AND ($2::DECIMAL IS NULL OR price >= $2) AND ($3::DECIMAL IS NULL OR price <= $3) ORDER BY ${orderBy}`,
            [`%${nama || ''}%`, min_price || null, max_price || null]
        );    
        return result.rows;
    } catch (err) {
        throw err;
    }
}

const pembelian = async ({userId, productId, jumlah}) => {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const productResult = await client.query(
                'SELECT price, stock FROM produk WHERE id = $1',
                [productId]
            );
            if (productResult.rows.length === 0) throw new Error("produk tidak ditemukan");
            const {price, stock} = productResult.rows[0];
            if (stock <= 0 || stock < jumlah) throw new Error("stok produk habis");

            const userResult = await client.query(
                'SELECT saldo FROM users WHERE id = $1',
                [userId]
            );
            if (userResult.rows.length === 0) throw new Error("user tidak ditemukan");
            const totalPrice = price * jumlah;
            console.log(totalPrice)
            const {saldo} = userResult.rows[0];
            if (saldo < totalPrice) throw new Error("saldo tidak cukup");
            await client.query(
                'UPDATE users SET saldo = saldo - $1 WHERE id = $2',
                [totalPrice, userId]
            );
            await client.query(
                'UPDATE produk SET stock = stock - $1 WHERE id = $2',
                [jumlah, productId]
            );
            await client.query('COMMIT');
            return [{total: totalPrice, jumlah, productId: productId}];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        };
    } catch (err) {
        throw err;
    }
}

const notificationBeli = async ({ idUser, productId, jumlah}) => {
    
    const orderId = `INV-${Date.now()}`; 
    const stock = await pool.query('SELECT stock, price FROM produk WHERE id = $1', [productId]);
    if(stock.rows.length === 0) throw new Error("produk tidak ditemukan");
    if(stock.rows[0].stock <= 0 || stock.rows[0].stock < jumlah) throw new Error("stok produk habis");
    const amount = stock.rows[0].price * jumlah;
    let parameter = {
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": 5000 + amount
        },
        "metadata": {
            "idUser": idUser,
            "price": amount,
            "productId": productId,
            "quantity": jumlah,
            "name": "bayar-produk"
        }      
    };
    try {
        const transaction = await snap.createTransaction(parameter);
        return (transaction);
    } catch (err) {
        throw err;
    }
};    



module.exports = {getProducts, pembelian, notificationBeli};