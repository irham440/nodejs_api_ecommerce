const pool = require('../config/db');
const apiError = require('../utils/apiError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const client = require('../config/redis');

const addUser = async ({name, password,email, phone}) => {
    if(!name) throw new Error("nama harus diisi");
    if(password === undefined) throw new Error("password harus diisi");
    if(!email) throw new Error("email harus diisi");
    if(!phone) throw new Error("nomor telepomn harus diisi");
    

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existingEmail = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email] 
      );
    if (existingEmail.rows.length > 0) throw new apiError(409, "email sudah digunakan", email)

    const existingPhone = await pool.query(
        'SELECT * FROM users WHERE phone = $1',
        [phone] 
      );
    if (existingPhone.rows.length > 0) throw new apiError(409, "nomor telepon sudah digunakan", phone)


    try {
      const result = await pool.query(
        'INSERT INTO users (nama,saldo, password, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, 0, hashedPassword, email, phone] 
    );
    const id = result.rows[0].id;
    const nama = result.rows[0].nama;
    return ({id: id, nama: nama})
    } catch (err) {
      throw err
    }
};


const login = async ({email, password}) => {
  if(!email) throw new Error("email diisi");

   try {
    const user = await pool.query(
      'SELECT password FROM users WHERE email = $1',
      [email] 
    );
    if (user.rows.length === 0) {
        throw new apiError(400, "user tidak ditemukan", email)
    }

    const hash = user.rows[0].password;
    const verify = await bcrypt.compare(password, hash)
    if(!verify) throw new apiError(400, "email atau password salah", email)

    const id = user.rows[0].id;
    const email = user.rows[0].email;
    const token = await jwt.sign(
      {id: id, email: email},
      process.env.JWT_SECRET,
      {expiresIn: "1h"}
    )

    const key = `login:${email}`
    await client.del(key)
    return token;
  } catch (err) {
    throw err;
  }
}

module.exports = { addUser, login };
