const pool = require('../config/db');
const apiError = require('../utils/apiError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const client = require('../config/redis');

const addUser = async ({name, password,email}) => {
    if(!name) throw new Error("nama diisi");
    if(password === undefined) throw new Error("password wajib diisi");
    if(!email) throw new Error("email diisi");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email] 
      );
    if (existingUser.rows.length > 0) throw new apiError(400, "email sudah digunakan", email)

    try {
      const result = await pool.query(
        'INSERT INTO users (nama,saldo, password, email) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, 0, hashedPassword, email] 
    );
    const id = result.rows[0].id;
    const nama = result.rows[0].nama;
    return ({id: id, nama: nama})
    } catch (err) {
      throw new apiError(450, "gagal menambahkan user", {name, email})
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
        throw new apiError(404, "user tidak ditemukan", email)
    }

    const hash = user.rows[0].password;
    const verify = await bcrypt.compare(password, hash)
    if(!verify) throw new apiError(404, "email atau password salah", email)

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
