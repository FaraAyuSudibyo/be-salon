const Validator    = require('fastest-validator')
const v            = new Validator()
const bcrypt       = require('bcrypt')
const { User }     = require('../models')
const { response } = require('../helpers/response.formatter')

module.exports = {

  // GET /profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.userId, { attributes: { exclude: ['password'] } })
      if (!user) return res.status(404).json(response(404, 'user not found'))
      return res.status(200).json(response(200, 'success', {
        id:    Number(user.id_users),
        name:  user.username,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PUT /profile  — FE kirim: name, phone
  updateProfile: async (req, res) => {
    try {
      const { name, phone } = req.body
      const schema = {
        name:  { type: 'string', min: 2 },
        phone: { type: 'string' }
      }
      const validate = v.validate({ name, phone }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      await User.update({ username: name, phone }, { where: { id_users: req.user.userId } })
      const updated = await User.findByPk(req.user.userId, { attributes: { exclude: ['password'] } })
      return res.status(200).json(response(200, 'updated', {
        id:    Number(updated.id_users),
        name:  updated.username,
        email: updated.email,
        phone: updated.phone,
        role:  updated.role,
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /profile/change-password  — FE kirim: old_password, new_password
  changePassword: async (req, res) => {
    try {
      const { old_password, new_password } = req.body
      const schema = {
        old_password: { type: 'string' },
        new_password: { type: 'string', min: 6 }
      }
      const validate = v.validate({ old_password, new_password }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      const user = await User.findByPk(req.user.userId)
      if (!user) return res.status(404).json(response(404, 'user not found'))

      const match = await bcrypt.compare(old_password, user.password)
      if (!match) return res.status(400).json(response(400, 'validasi error', 'Password lama salah'))

      const hashed = await bcrypt.hash(new_password, 10)
      await User.update({ password: hashed }, { where: { id_users: req.user.userId } })
      return res.status(200).json(response(200, 'password changed'))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  }
}
