const pool = require('../config/db');

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

module.exports = {getProducts};