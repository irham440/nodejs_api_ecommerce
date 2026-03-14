const pool = require('../config/db')
const apiError = require("../utils/apiError")

const transfer = async ({senderId, receiverPhone, amount}) => {
    if(!senderId) throw new Error("senderId diisi");
    if(!receiverPhone) throw new Error("receiverPhone diisi");
    if(amount === undefined || isNaN(amount)) throw new Error("amount harus angka");

    receiverPhone = receiverPhone.replace(0, "+62"); // Ganti 0 di awal dengan 62 untuk format internasional
    const phone = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [receiverPhone]
    );
    console.log(phone)
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
      throw new Error('Saldo tidak cukup atau user tidak ditemukan');
    }

    // 3. Tambah saldo penerima
    const tambahSaldo = await client.query(
      'UPDATE users SET saldo = saldo + $1 WHERE id = $2 RETURNING *',
      [amount, receiverId]
    );

    if (tambahSaldo.rowCount === 0) {
      throw new Error('Penerima tidak ditemukan');
    }

    // 4. SIMPAN PERUBAHAN (Jika semua lancar)
    await client.query('COMMIT');

    return { message: 'Transfer berhasil', sender: potongSaldo.rows[0], receiver: tambahSaldo.rows[0] };

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