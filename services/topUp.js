const pool = require('../config/db')


const topUp = async ({idUser, amount}) =>{
    const result = await pool.query(
        'UPDATE users SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo',
        [amount, idUser]
    )
    console.log(result.rows[0])
    return ({saldo: result.rows[0].saldo})
}

module.exports = topUp