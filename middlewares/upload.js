const multer = require("multer");
const path = require("path");

const konfigurasiPenyimpanan = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, callback) => {
    const waktuSekarang = Date.now();
    const angkaAcak = Math.round(Math.random() * 1e9);
    const ekstensiFile = path.extname(file.originalname); 
    const namaFileBaru = waktuSekarang + "-" + angkaAcak + ekstensiFile;
    callback(null, namaFileBaru);
  },
});

module.exports = multer({ storage: konfigurasiPenyimpanan });
