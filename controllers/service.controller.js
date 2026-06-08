const Validator = require("fastest-validator");
const validator = new Validator();
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const { Service } = require("../models");
const { response } = require("../helpers/response.formatter");

module.exports = {
  getService: async (req, res) => {
    try {
      const { name, category } = req.query;
      const kondisiCari = {};
      if (name) kondisiCari.name = { [Op.like]: `%${name}%` };
      if (category) kondisiCari.category = category;

      const semuaService = await Service.findAll({
        where: kondisiCari,
        order: [["created_at", "DESC"]],
      });

      const dataOutput = semuaService.map((service) => ({
        id: Number(service.id_services),
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        description: service.description,
        image: service.image,
      }));
      return res.status(200).json(response(200, "success", dataOutput));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // detail satu service
  detailService: async (req, res) => {
    try {
      const dataService = await Service.findByPk(req.params.id);
      if (!dataService)
        return res.status(404).json(response(404, "service not found"));

      return res.status(200).json(
        response(200, "success", {
          id: Number(dataService.id_services),
          name: dataService.name,
          category: dataService.category,
          price: dataService.price,
          duration: dataService.duration,
          description: dataService.description,
          image: dataService.image,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // tambah service baru (admin)
  createService: async (req, res) => {
    try {
      const { name, category, price, duration, description } = req.body;

      const schema = {
        name: { type: "string", min: 2 },
        category: { type: "string" },
        price: { type: "number", positive: true, integer: true },
      };
      const hasilValidasi = validator.validate(
        { name, category, price: Number(price) },
        schema,
      );
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      const serviceBaru = await Service.create({
        name,
        category,
        price: Number(price),
        duration: duration ? Number(duration) : null,
        description: description || "",
        image: req.file ? req.file.filename : null, 
      });

      return res.status(201).json(
        response(201, "created", {
          id: Number(serviceBaru.id_services),
          name: serviceBaru.name,
          category: serviceBaru.category,
          price: serviceBaru.price,
          duration: serviceBaru.duration,
          description: serviceBaru.description,
          image: serviceBaru.image,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // edit service (admin)
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, price, duration, description } = req.body;

      const schema = {
        name: { type: "string", min: 2 },
        category: { type: "string" },
        price: { type: "number", positive: true, integer: true },
      };
      const hasilValidasi = validator.validate(
        { name, category, price: Number(price) },
        schema,
      );
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      // ambil data service lama sebelum diubah
      const serviceSebelumDiubah = await Service.findByPk(id);
      if (!serviceSebelumDiubah)
        return res.status(404).json(response(404, "service not found"));

      // jika ada gambar baru yang diupload, hapus gambar lama dari folder uploads
      if (req.file) {
        const namaGambarLama = serviceSebelumDiubah.getDataValue("image");
        if (namaGambarLama && !namaGambarLama.startsWith("http")) {
          const lokasiFileLama = path.join(
            __dirname,
            "../uploads",
            namaGambarLama,
          );
          if (fs.existsSync(lokasiFileLama)) fs.unlinkSync(lokasiFileLama);
        }
      }

      await Service.update(
        {
          name,
          category,
          price: Number(price),
          duration: duration ? Number(duration) : serviceSebelumDiubah.duration,
          description: description || serviceSebelumDiubah.description,
          // kalau ada gambar baru pakai gambar baru, kalau tidak pakai gambar lama
          image: req.file
            ? req.file.filename
            : serviceSebelumDiubah.getDataValue("image"),
        },
        { where: { id_services: id } },
      );

      const serviceTerbaru = await Service.findByPk(id);
      return res.status(200).json(
        response(200, "updated", {
          id: Number(serviceTerbaru.id_services),
          name: serviceTerbaru.name,
          category: serviceTerbaru.category,
          price: serviceTerbaru.price,
          duration: serviceTerbaru.duration,
          description: serviceTerbaru.description,
          image: serviceTerbaru.image,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // hapus service (admin)
  deleteService: async (req, res) => {
    try {
      await Service.destroy({ where: { id_services: req.params.id } });
      return res.status(200).json(response(200, "deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
};
