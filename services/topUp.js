const pool = require('../config/db')
const snap = require('../config/snap');
const apiError = require("../utils/apiError")
const redisClient = require('../config/redis');

const notificationTopup = async ({ idUser, amount}) => {
    
    const orderId = `INV-${Date.now()}`; 

    let parameter = {
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": 5000 + amount
        },
        "metadata": {
            "idUser": idUser,
            "price": amount,
            "quantity": 1,
            "name": "Top-up"
        }
        
    };
    try {
        const transaction = await snap.createTransaction(parameter);
        return (transaction);
    } catch (err) {
        throw err;
    }
};    


const topUp = async ({idUser, amount}) =>{
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('invalid top-up amount');
    const result = await pool.query(
        'UPDATE users SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo, nama',
        [numAmount, idUser]
    );
    if (!result.rows || result.rows.length === 0) throw new Error('user not found for top-up');
    const {saldo, nama} = result.rows[0];
        // invalidate or update profile cache so subsequent /profile reflects new saldo
        try {
            const key = `${idUser}:getProfil`;
            await redisClient.del(key);
        } catch (err) {
            console.warn('failed to clear profile cache after topUp', err.message)
        }
        return {saldo, idUser, nama};
}



module.exports = {notificationTopup, topUp};