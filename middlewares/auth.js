const jwt = require("jsonwebtoken");
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require("../config/base.config");

module.exports = {
  verifyToken: async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json(response(401, "unauthorized"));

    try {
      const dataUserDariToken = jwt.verify(token, auth_secret);
      req.user = dataUserDariToken; // isi: { userId, email, name, phone, role }
      next(); // lanjut ke controller
    } catch (error) {
      return res.status(401).json(response(401, "unauthorized"));
    }
  },

  verifyAdmin: async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json(response(401, "unauthorized"));

    try {
      const dataUserDariToken = jwt.verify(token, auth_secret);
      req.user = dataUserDariToken;

      if (req.user.role !== "admin")
        return res.status(403).json(response(403, "forbidden - admin only"));

      next();
    } catch (error) {
      return res.status(401).json(response(401, "unauthorized"));
    }
  },
};
