const { Booking, Service, User, Payment } = require('../models')
const { response } = require('../helpers/response.formatter')
const { Op }       = require('sequelize')

module.exports = {

  // GET /reports/summary  — dipakai Dashboard FE
  getSummary: async (req, res) => {
    try {
      const paidPayments    = await Payment.findAll({ where: { status: 'paid' } })
      const totalRevenue    = paidPayments.reduce((s, p) => s + (p.amount || 0), 0)
      const totalBookings   = await Booking.count()
      const pendingBookings = await Booking.count({ where: { status: 'pending' } })
      const pendingPayments = await Payment.count({ where: { status: 'pending_verification' } })
      const homeServiceCount= await Booking.count({ where: { service_type: 'homeservice' } })
      const totalServices   = await Service.count()
      const totalCustomers  = await User.count({ where: { role: 'customer' } })

      return res.status(200).json(response(200, 'success', {
        totalRevenue, totalBookings, pendingBookings,
        pendingPayments, homeServiceCount, totalServices, totalCustomers
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // GET /reports/revenue-by-service  — dipakai halaman Reports FE
  getRevenueByService: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        where:   { status: 'completed' },
        include: [
          { model: Service, as: 'service', attributes: ['name'] },
          { model: Payment, as: 'payment', where: { status: 'paid' }, required: true }
        ]
      })

      const map = {}
      bookings.forEach(b => {
        const name = b.service ? b.service.name : 'Unknown'
        if (!map[name]) map[name] = { service_name: name, total: 0, count: 0 }
        map[name].total += b.payment ? b.payment.amount : 0
        map[name].count += 1
      })
      return res.status(200).json(response(200, 'success',
        Object.values(map).sort((a, b) => b.total - a.total)
      ))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // GET /reports/booking-stats?month=6&year=2026
  getBookingStats: async (req, res) => {
    try {
      const { month, year } = req.query
      const where = {}
      if (month && year) {
        where.date = {
          [Op.between]: [
            `${year}-${String(month).padStart(2,'0')}-01`,
            `${year}-${String(month).padStart(2,'0')}-31`
          ]
        }
      }
      const rows = await Booking.findAll({ where })
      return res.status(200).json(response(200, 'success', {
        pending:     rows.filter(b => b.status === 'pending').length,
        confirmed:   rows.filter(b => b.status === 'confirmed').length,
        in_progress: rows.filter(b => b.status === 'in_progress').length,
        completed:   rows.filter(b => b.status === 'completed').length,
        cancelled:   rows.filter(b => b.status === 'cancelled').length
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  }
}
