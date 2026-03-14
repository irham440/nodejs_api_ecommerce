const pool = require('../config/db')
const snap = require('../config/snap');
const apiError = require("../utils/apiError")

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
    const result = await pool.query(
        'UPDATE users SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo, nama',
        [amount, idUser]
    );
    const {saldo, nama} = result.rows[0];
    return {saldo, idUser, nama};
}



module.exports = {notificationTopup, topUp};