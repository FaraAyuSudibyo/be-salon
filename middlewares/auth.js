const jwt = require("jsonwebtoken");
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require("../config/base.config");

module.exports = {
  // middleware untuk memastikan user sudah login (punya token JWT)
  // dipakai di semua route yang butuh login
  verifyToken: async (req, res, next) => {
    // ambil token dari header Authorization
    const token = req.header("Authorization");
    if (!token) return res.status(401).json(response(401, "unauthorized"));

    try {
      // cek apakah token valid dan belum kadaluarsa
      const dataUserDariToken = jwt.verify(token, auth_secret);
      // simpan data user di req.user agar bisa dipakai di controller
      req.user = dataUserDariToken; // isi: { userId, email, name, phone, role }
      next(); // lanjut ke controller
    } catch (error) {
      return res.status(401).json(response(401, "unauthorized"));
    }
  },

  // middleware khusus untuk memastikan user adalah admin
  // dipakai di route yang hanya boleh diakses admin
  verifyAdmin: async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json(response(401, "unauthorized"));

    try {
      const dataUserDariToken = jwt.verify(token, auth_secret);
      req.user = dataUserDariToken;

      // cek apakah role user adalah admin
      if (req.user.role !== "admin")
        return res.status(403).json(response(403, "forbidden - admin only"));

      next();
    } catch (error) {
      return res.status(401).json(response(401, "unauthorized"));
    }
  },
};
