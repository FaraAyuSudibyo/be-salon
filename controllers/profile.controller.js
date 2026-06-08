const Validator = require("fastest-validator");
const validator = new Validator();
const bcrypt = require("bcrypt");
const { User } = require("../models");
const { response } = require("../helpers/response.formatter");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const dataUser = await User.findByPk(req.user.userId, {
        attributes: { exclude: ["password"] }, // jangan tampilkan password
      });
      if (!dataUser)
        return res.status(404).json(response(404, "user not found"));

      return res.status(200).json(
        response(200, "success", {
          id: Number(dataUser.id_users),
          name: dataUser.username,
          email: dataUser.email,
          phone: dataUser.phone,
          role: dataUser.role,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // update profil user
  updateProfile: async (req, res) => {
    try {
      const { name, phone } = req.body;

      const schema = {
        name: { type: "string", min: 2 },
        phone: { type: "string" },
      };
      const hasilValidasi = validator.validate({ name, phone }, schema);
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      // update data di database
      await User.update(
        { username: name, phone },
        { where: { id_users: req.user.userId } },
      );

      const userTerbaru = await User.findByPk(req.user.userId, {
        attributes: { exclude: ["password"] },
      });
      return res.status(200).json(
        response(200, "updated", {
          id: Number(userTerbaru.id_users),
          name: userTerbaru.username,
          email: userTerbaru.email,
          phone: userTerbaru.phone,
          role: userTerbaru.role,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
  //  ganti password
  changePassword: async (req, res) => {
    try {
      const { old_password, new_password } = req.body;

      const schema = {
        old_password: { type: "string" },
        new_password: { type: "string", min: 6 },
      };
      const hasilValidasi = validator.validate(
        { old_password, new_password },
        schema,
      );
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      const dataUser = await User.findByPk(req.user.userId);
      if (!dataUser)
        return res.status(404).json(response(404, "user not found"));

      // cek apakah password lama yang diinput sesuai dengan yang di database
      const passwordLamaCocok = await bcrypt.compare(
        old_password,
        dataUser.password,
      );
      if (!passwordLamaCocok)
        return res
          .status(400)
          .json(response(400, "validasi error", "Password lama salah"));

      // enkripsi password baru sebelum disimpan
      const passwordBaruTerenkripsi = await bcrypt.hash(new_password, 10);
      await User.update(
        { password: passwordBaruTerenkripsi },
        { where: { id_users: req.user.userId } },
      );
      return res.status(200).json(response(200, "password changed"));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
};
