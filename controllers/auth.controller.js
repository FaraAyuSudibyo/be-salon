const Validator = require("fastest-validator");
const validator = new Validator();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require("../config/base.config");

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      // aturan validasi inputan
      const schema = {
        name: { type: "string", min: 2 },
        email: { type: "email" },
        password: { type: "string", min: 6 },
        phone: { type: "string" },
      };
      const hasilValidasi = validator.validate(
        { name, email, password, phone },
        schema,
      );
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      // cek apakah email sudah digunakan
      const userSudahAda = await User.findOne({ where: { email } });
      if (userSudahAda)
        return res
          .status(400)
          .json(response(400, "validasi error", "Email sudah digunakan"));

      // hash password sebelum disimpan ke database
      const passwordTerenkripsi = await bcrypt.hash(password, 10);

      const userBaru = await User.create({
        username: name,
        email,
        password: passwordTerenkripsi,
        phone,
        role: "customer",
      });

      return res.status(201).json(
        response(201, "created", {
          id: userBaru.id_users,
          name: userBaru.username,
          email: userBaru.email,
          phone: userBaru.phone,
          role: userBaru.role,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const schema = {
        email: { type: "email" },
        password: { type: "string" },
      };
      const hasilValidasi = validator.validate({ email, password }, schema);
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      // cari user berdasarkan email
      const dataUser = await User.findOne({ where: { email } });
      if (!dataUser)
        return res
          .status(400)
          .json(response(400, "validasi error", "Email atau password salah"));

      // cek password cocok dengan yang ada di database
      const passwordCocok = await bcrypt.compare(password, dataUser.password);
      if (!passwordCocok)
        return res
          .status(400)
          .json(response(400, "validasi error", "Email atau password salah"));

      const tokenJWT = jwt.sign(
        {
          userId: Number(dataUser.id_users),
          email: dataUser.email,
          name: dataUser.username,
          phone: dataUser.phone,
          role: dataUser.role,
        },
        auth_secret,
        { expiresIn: "24h" },
      );

      return res.status(200).json(
        response(200, "success", {
          user: {
            id: Number(dataUser.id_users),
            name: dataUser.username,
            email: dataUser.email,
            phone: dataUser.phone,
            role: dataUser.role,
          },
          token: tokenJWT,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
};
