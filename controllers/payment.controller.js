const path         = require('path')
const fs           = require('fs')
const { Payment, Booking } = require('../models')
const { response } = require('../helpers/response.formatter')

module.exports = {

  // GET /payments  (admin, query: status)
  getPayments: async (req, res) => {
    try {
      const where = {}
      if (req.query.status && req.query.status !== 'semua') where.status = req.query.status

      const payments = await Payment.findAll({
        where,
        include: [{ model: Booking, as: 'booking' }],
        order:   [['created_at', 'DESC']]
      })
      return res.status(200).json(response(200, 'success', payments))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /payments/:bookingId/upload-proof  — customer upload bukti
  // FE kirim form-data key: payment_proof (file)
  uploadProof: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json(response(400, 'Bukti pembayaran harus diupload'))

      const booking = await Booking.findByPk(req.params.id)
      if (!booking) return res.status(404).json(response(404, 'booking not found'))
      if (Number(booking.id_users) !== req.user.userId)
        return res.status(403).json(response(403, 'forbidden'))

      const pay = await Payment.findOne({ where: { id_bookings: req.params.id } })
      if (!pay) return res.status(404).json(response(404, 'payment not found'))

      // hapus bukti lama
      const oldProof = pay.getDataValue('payment_proof')
      if (oldProof && !oldProof.startsWith('http')) {
        const fp = path.join(__dirname, '../uploads', oldProof)
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      }

      await Payment.update(
        { payment_proof: req.file.filename, status: 'pending_verification', reject_reason: null },
        { where: { id_bookings: req.params.id } }
      )
      const updated = await Payment.findOne({ where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'uploaded', updated))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /payments/:bookingId/confirm  — admin konfirmasi
  confirmPayment: async (req, res) => {
    try {
      const pay = await Payment.findOne({ where: { id_bookings: req.params.id } })
      if (!pay) return res.status(404).json(response(404, 'payment not found'))

      await Payment.update({ status: 'paid' }, { where: { id_bookings: req.params.id } })
      const updated = await Payment.findOne({ where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'payment confirmed', updated))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /payments/:bookingId/reject  — admin tolak, FE kirim: reason
  rejectPayment: async (req, res) => {
    try {
      const pay = await Payment.findOne({ where: { id_bookings: req.params.id } })
      if (!pay) return res.status(404).json(response(404, 'payment not found'))

      // hapus file bukti yang ditolak
      const oldProof = pay.getDataValue('payment_proof')
      if (oldProof && !oldProof.startsWith('http')) {
        const fp = path.join(__dirname, '../uploads', oldProof)
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      }

      await Payment.update({
        status:        'unpaid',
        payment_proof: null,
        reject_reason: req.body.reason || 'Bukti pembayaran tidak valid'
      }, { where: { id_bookings: req.params.id } })

      const updated = await Payment.findOne({ where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'payment rejected', updated))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  }
}
