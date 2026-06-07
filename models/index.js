"use strict";
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename); // nama file ini sendiri: "index.js"
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

// buat koneksi ke database menggunakan konfigurasi dari config.js
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

// baca semua file .js di folder models (kecuali index.js ini sendiri)
// lalu daftarkan setiap model ke dalam object "db"
// jadi kita tidak perlu require satu-satu setiap model
fs.readdirSync(__dirname)
  .filter((namaFile) => {
    return (
      namaFile.indexOf(".") !== 0 && // abaikan file hidden (.gitignore dll)
      namaFile !== basename && // abaikan file index.js ini
      namaFile.slice(-3) === ".js" // ambil hanya file .js
    );
  })
  .forEach((namaFile) => {
    // panggil fungsi di setiap file model, dan berikan sequelize + DataTypes sebagai parameter
    const model = require(path.join(__dirname, namaFile))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model; // daftarkan model ke db, contoh: db['User'], db['Booking']
  });

// jalankan fungsi associate di setiap model untuk menghubungkan relasi antar tabel
// contoh: User.hasMany(Booking), Booking.belongsTo(Service)
Object.keys(db).forEach((namaModel) => {
  if (db[namaModel].associate) db[namaModel].associate(db);
});

db.sequelize = sequelize; // simpan instance koneksi database
db.Sequelize = Sequelize; // simpan library Sequelize (untuk Op.like, DataTypes, dll)
module.exports = db; // export agar bisa dipakai di controller dan tempat lain
