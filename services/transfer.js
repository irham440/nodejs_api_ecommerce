const pool = require('../config/db')
const apiError = require("../utils/apiError")

const transfer = async ({senderId, receiverPhone, amount}) => {
    if(!senderId) throw new Error("senderId diisi");
    if(!receiverPhone) throw new Error("receiverPhone diisi");
    if(amount === undefined || isNaN(amount) || amount <= 0) throw new Error("amount harus angka");

    receiverPhone = receiverPhone.replace(/^0/, "+62");
    const sender = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [senderId]
    );
    if(sender.rows.length === 0) throw new apiError(400, "pengirim tidak ditemukan", senderId);
    const phone = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [receiverPhone]
    );
    if(senderId === phone.rows[0].id) throw new apiError(400, "tidak bisa transfer ke diri sendiri", receiverPhone);
    if(phone.rows.length === 0) throw new apiError(400, "nomor telepon penerima tidak ditemukan", receiverPhone);
    const receiverId = phone.rows[0].id;

  // Ambil satu koneksi khusus dari pool
  const client = await pool.connect();

  try {
    // 1. MULAI TRANSAKSI
    await client.query('BEGIN');

    // 2. Kurangi saldo pengirim
    const potongSaldo = await client.query(
      'UPDATE users SET saldo = saldo - $1 WHERE id = $2 AND saldo >= $1 RETURNING *',
      [amount, senderId]
    );

    // Cek apakah saldo cukup atau user ada
    if (potongSaldo.rowCount === 0) {
      throw new Error('Saldo tidak cukup');
    }

    // 3. Tambah saldo penerima
    const tambahSaldo = await client.query(
      'UPDATE users SET saldo = saldo + $1 WHERE id = $2 RETURNING *',
      [amount, receiverId]
    );

    if (tambahSaldo.rowCount === 0) {
      throw new Error('gagal menambahkan saldo ke penerima');
    }

    // 4. SIMPAN PERUBAHAN (Jika semua lancar)
    await client.query('COMMIT');
    const result = (p) => {
      const {id, nama, saldo } = p.rows[0]
      return {id, nama, saldo}
    }
    const sender = result(potongSaldo);
    const receiver = result(tambahSaldo);
    const key = `${idUser}:getProfil`;
    const cached = await redisClient.get(key);
    let profileObj;
    if (cached) {
        try {
            profileObj = JSON.parse(cached);
        } catch (e) {
            profileObj = null;
        }
    }
    if (!profileObj) {
                // create a minimal profile object if cache empty
        profileObj = { id: sender.id, nama: sender.nama, saldo: sender.saldo };
    } else {
                // update existing cached profile fields
        profileObj.saldo = sender.saldo;
        profileObj.nama = sender.nama;
    }
    await redisClient.set(key, JSON.stringify(profileObj));
    return {pengirim: sender, receiver: receiver };

  } catch (err) {
    // 5. BATALKAN SEMUA (Jika ada error di tengah jalan)
    await client.query('ROLLBACK');
    throw err; // Lempar error ke handler

  } finally {
    // 6. Kembalikan koneksi ke pool agar bisa dipakai lagi
    client.release();
  }
};

module.exports = {transfer};