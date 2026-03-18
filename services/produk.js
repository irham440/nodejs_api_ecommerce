const pool = require('../config/db');
const snap = require('../config/snap');
const redisClient = require('../config/redis');

const apiError = require('../utils/apiError');
const getProducts = async ({nama, min_price, max_price}, sort) => {
    try {
        const caheKey = `products:${nama || ''}:${min_price || ''}:${max_price || ''}:${sort || ''}`;
        const cache = await redisClient.get(caheKey);
        if(cache){
            console.log("dari cache")
            const ttl = await redisClient.ttl(caheKey); 
            console.log(`ttl: ${ttl} detik`)
            return JSON.parse(cache);
        }
        
        const orderBy = sort === "desc" ? "price DESC" : "price ASC";
        const result = await pool.query(`SELECT id, name, price, stock FROM produk WHERE ($1::VARCHAR IS NULL OR name ILIKE $1) AND ($2::DECIMAL IS NULL OR price >= $2) AND ($3::DECIMAL IS NULL OR price <= $3) ORDER BY ${orderBy}`,
            [`%${nama || ''}%`, min_price || null, max_price || null]
        );   
        if(result.rows.length === 0) throw new Error("produk tidak ditemukan");
        console.log("dari database")
        await redisClient.setEx(caheKey, 60, JSON.stringify(result.rows));
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

            await client.query(
                'UPDATE produk SET stock = stock - $1 WHERE id = $2',
                [jumlah, productId]
            );

            const totalPrice = price * jumlah;
            const {rows: orderRows} = await client.query(
                'INSERT INTO orders (user_id, total_price) VALUES ($1, $2) RETURNING id',
                [userId,totalPrice]
            );

            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderRows[0].id, productId, jumlah, price]
            );
            const keys = await redisClient.keys('products:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
                console.log(`Berhasil hapus ${keys.length} cache produk`);
            }

            await client.query('COMMIT');
            return [{order_id: orderRows[0].id, total: totalPrice}];
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
const pay = async ({orderId}) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {rows} = await client.query(
            'SELECT saldo FROM users WHERE id = (SELECT user_id FROM orders WHERE id = $1)',
            [orderId]
        );
        const statusOrder = await client.query(
            'SELECT status, total_price FROM orders WHERE id = $1',
            [orderId]
        );

        if(statusOrder.rows.length === 0) throw new Error("order tidak ditemukan");
        if(statusOrder.rows[0].status === "paid") throw new Error("order sudah dibayar");
        if (rows.length === 0) throw new Error("user tidak ditemukan");
        const saldo = rows[0].saldo;
        const total_price = statusOrder.rows[0].total_price;
        const saldoNum = Number(saldo);
        const totalPriceNum = Number(total_price);

        if (isNaN(saldoNum) || isNaN(totalPriceNum)) throw new Error("nilai saldo atau total order tidak valid");
        if (saldoNum < totalPriceNum) throw new Error("saldo tidak cukup");
        await client.query(
            'UPDATE users SET saldo = saldo - $1 WHERE id = (SELECT user_id FROM orders WHERE id = $2)',
            [totalPriceNum, orderId]
        );
        await client.query(
            'UPDATE orders SET status = $1 WHERE id = $2',
            ['paid', orderId]
        );
        await client.query(
            'UPDATE order_items SET status = $1 WHERE order_id = $2',
            ['processing', orderId]
        );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
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

const getOrder = async ({userId}) => {
    try {

        const result = await pool.query(
            'SELECT o.id, o.total_price, o.status, oi.product_id, oi.quantity, oi.price, p.name FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN produk p ON oi.product_id = p.id WHERE o.user_id = $1',
            [userId]
        );
        if(result.rows.length === 0) throw new Error("pesanan tidak ditemukan");
        
        console.log("dari database")
        return result.rows;
    } catch (err) {
        throw err;
    }
}

module.exports = {getProducts, pembelian, notificationBeli, pay, getOrder};