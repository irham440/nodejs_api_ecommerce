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
        throw new apiError(400, "gagal melakukan top-up", {idUser, amount});
    }
};    


const topUp = async ({idUser, amount}) =>{
    const result = await pool.query(
        'UPDATE users SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo',
        [amount, idUser]
    )
    console.log(result.rows[0])
    return ({saldo: result.rows[0].saldo})
}



module.exports = {notificationTopup, topUp};