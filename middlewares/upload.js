const multer = require("multer");
const path = require("path");

// konfigurasi penyimpanan file yang diupload
const konfigurasiPenyimpanan = multer.diskStorage({
  // tentukan folder tujuan penyimpanan file
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "../uploads"));
  },
  // buat nama file yang unik agar tidak bentrok dengan file lain
  filename: (req, file, callback) => {
    const waktuSekarang = Date.now();
    const angkaAcak = Math.round(Math.random() * 1e9);
    const ekstensiFile = path.extname(file.originalname); // contoh: .jpg, .png
    const namaFileBaru = waktuSekarang + "-" + angkaAcak + ekstensiFile;
    callback(null, namaFileBaru);
  },
});

module.exports = multer({ storage: konfigurasiPenyimpanan });
