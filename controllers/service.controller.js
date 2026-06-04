const Validator    = require('fastest-validator')
const v            = new Validator()
const { Op }       = require('sequelize')
const path         = require('path')
const fs           = require('fs')
const { Service }  = require('../models')
const { response } = require('../helpers/response.formatter')

module.exports = {

  // GET /services  (query: name, category)
  // FE pakai: s.id, s.name, s.category, s.price, s.duration, s.description, s.image
  getService: async (req, res) => {
    try {
      const { name, category } = req.query
      const where = {}
      if (name)     where.name     = { [Op.like]: `%${name}%` }
      if (category) where.category = category

      const services = await Service.findAll({ where, order: [['created_at', 'DESC']] })

      // mapping output agar id nya bernama "id" (sesuai yang dipakai FE: s.id)
      const data = services.map(s => ({
        id:          Number(s.id_services),
        name:        s.name,
        category:    s.category,
        price:       s.price,
        duration:    s.duration,
        description: s.description,
        image:       s.image
      }))
      return res.status(200).json(response(200, 'success', data))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // GET /services/:id
  detailService: async (req, res) => {
    try {
      const s = await Service.findByPk(req.params.id)
      if (!s) return res.status(404).json(response(404, 'service not found'))
      return res.status(200).json(response(200, 'success', {
        id: Number(s.id_services), name: s.name, category: s.category,
        price: s.price, duration: s.duration, description: s.description, image: s.image
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // POST /services  (form-data: name, category, price, duration, description, image file)
  createService: async (req, res) => {
    try {
      const { name, category, price, duration, description } = req.body
      const schema = {
        name:     { type: 'string', min: 2 },
        category: { type: 'string' },
        price:    { type: 'number', positive: true, integer: true }
      }
      const validate = v.validate({ name, category, price: Number(price) }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      const s = await Service.create({
        name,
        category,
        price:       Number(price),
        duration:    duration ? Number(duration) : null,
        description: description || '',
        image:       req.file ? req.file.filename : null
      })
      return res.status(201).json(response(201, 'created', {
        id: Number(s.id_services), name: s.name, category: s.category,
        price: s.price, duration: s.duration, description: s.description, image: s.image
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PUT /services/:id
  updateService: async (req, res) => {
    try {
      const { id } = req.params
      const { name, category, price, duration, description } = req.body
      const schema = {
        name:     { type: 'string', min: 2 },
        category: { type: 'string' },
        price:    { type: 'number', positive: true, integer: true }
      }
      const validate = v.validate({ name, category, price: Number(price) }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      const before = await Service.findByPk(id)
      if (!before) return res.status(404).json(response(404, 'service not found'))

      // hapus gambar lama jika upload gambar baru
      if (req.file) {
        const oldImg = before.getDataValue('image')
        if (oldImg && !oldImg.startsWith('http')) {
          const fp = path.join(__dirname, '../uploads', oldImg)
          if (fs.existsSync(fp)) fs.unlinkSync(fp)
        }
      }

      await Service.update({
        name, category,
        price:       Number(price),
        duration:    duration ? Number(duration) : before.duration,
        description: description || before.description,
        image:       req.file ? req.file.filename : before.getDataValue('image')
      }, { where: { id_services: id } })

      const updated = await Service.findByPk(id)
      return res.status(200).json(response(200, 'updated', {
        id: Number(updated.id_services), name: updated.name, category: updated.category,
        price: updated.price, duration: updated.duration, description: updated.description, image: updated.image
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // DELETE /services/:id
  deleteService: async (req, res) => {
    try {
      await Service.destroy({ where: { id_services: req.params.id } })
      return res.status(200).json(response(200, 'deleted'))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  }
}
