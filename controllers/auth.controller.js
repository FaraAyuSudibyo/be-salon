const Validator      = require('fastest-validator')
const v              = new Validator()
const bcrypt         = require('bcrypt')
const jwt            = require('jsonwebtoken')
const { User }       = require('../models')
const { response }   = require('../helpers/response.formatter')
const { auth_secret } = require('../config/base.config')

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone } = req.body

      const schema = {
        name:     { type: 'string', min: 2 },
        email:    { type: 'email' },
        password: { type: 'string', min: 6 },
        phone:    { type: 'string' }
      }
      const validate = v.validate({ name, email, password, phone }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      const existing = await User.findOne({ where: { email } })
      if (existing) return res.status(400).json(response(400, 'validasi error', 'Email sudah digunakan'))

      const hashed = await bcrypt.hash(password, 10)
      const user   = await User.create({ username: name, email, password: hashed, phone, role: 'customer' })

      return res.status(201).json(response(201, 'created', {
        id:       user.id_users,
        name:     user.username,
        email:    user.email,
        phone:    user.phone,
        role:     user.role
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // POST /auth/login
  // FE kirim: email, password  → FE simpan: id, name, email, phone, role
  login: async (req, res) => {
    try {
      const { email, password } = req.body

      const schema = {
        email:    { type: 'email' },
        password: { type: 'string' }
      }
      const validate = v.validate({ email, password }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      const user = await User.findOne({ where: { email } })
      if (!user) return res.status(400).json(response(400, 'validasi error', 'Email atau password salah'))

      const match = await bcrypt.compare(password, user.password)
      if (!match) return res.status(400).json(response(400, 'validasi error', 'Email atau password salah'))

      const token = jwt.sign(
        { userId: Number(user.id_users), email: user.email, name: user.username, phone: user.phone, role: user.role },
        auth_secret,
        { expiresIn: '24h' }
      )

      // format output sesuai yang dipakai FE di AuthContext (user.id, user.name, dst)
      return res.status(200).json(response(200, 'success', {
        user: {
          id:     Number(user.id_users),
          name:   user.username,
          email:  user.email,
          phone:  user.phone,
          role:   user.role,
        },
        token
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  }
}
