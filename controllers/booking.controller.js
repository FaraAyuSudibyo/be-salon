const Validator              = require('fastest-validator')
const v                      = new Validator()
const { Op }                 = require('sequelize')
const { Booking, Service, User, Payment, Review } = require('../models')
const { response }           = require('../helpers/response.formatter')

const HOME_SERVICE_FEE = 50000

// Helper: format satu booking jadi shape yang dipakai FE
// FE pakai: b.id, b.customerId, b.customerName, b.customerPhone,
//           b.serviceId, b.serviceName, b.servicePrice,
//           b.serviceType, b.address, b.totalPrice, b.date, b.time,
//           b.status, b.paymentMethod, b.paymentStatus, b.paymentProof,
//           b.rejectReason, b.notes, b.waNotified, b.review, b.createdAt
function fmt(b) {
  const pay = b.payment || null
  const rev = b.review  || null
  const svc = b.service || null
  const usr = b.user    || null

  return {
    id:            Number(b.id_bookings),
    customerId:    Number(b.id_users),
    customerName:  usr ? usr.username : '',
    customerPhone: usr ? usr.phone    : '',
    serviceId:     Number(b.id_services),
    serviceName:   svc ? svc.name     : '',
    servicePrice:  svc ? svc.price    : 0,
    serviceType:   b.service_type,
    address:       b.address   || '',
    totalPrice:    b.total_price,
    date:          b.date,
    time:          b.time,
    status:        b.status,
    notes:         b.notes || '',
    // dari tabel payments
    paymentMethod: pay ? pay.method        : '',
    paymentStatus: pay ? pay.status        : 'unpaid',
    paymentProof:  pay ? pay.payment_proof : null,
    rejectReason:  pay ? pay.reject_reason : null,
    // review
    review: rev ? {
      rating:    rev.rating,
      comment:   rev.comment,
      createdAt: rev.created_at
    } : null,
    waNotified: false,
    createdAt:  b.created_at
  }
}

const INCLUDE_ALL = [
  { model: User,    as: 'user',    attributes: ['id_users','username','phone'] },
  { model: Service, as: 'service', attributes: ['id_services','name','price','category','duration'] },
  { model: Payment, as: 'payment' },
  { model: Review,  as: 'review'  }
]

module.exports = {

  // POST /bookings
  // FE kirim: serviceId, serviceType, address, date, time, paymentMethod, notes
  createBooking: async (req, res) => {
    try {
      const { serviceId, service_type, serviceType, address, date, time, paymentMethod, payment_method, notes } = req.body

      const svcId  = Number(serviceId  || req.body.id_services)
      const svcTyp = service_type  || serviceType  || 'onsite'
      const payMet = payment_method || paymentMethod || 'transfer'

      const schema = {
        svcId:  { type: 'number', positive: true, integer: true },
        date:   { type: 'string' },
        time:   { type: 'string' },
        payMet: { type: 'string' }
      }
      const validate = v.validate({ svcId, date, time, payMet }, schema)
      if (validate.length > 0) return res.status(400).json(response(400, 'validasi error', validate))

      if (svcTyp === 'homeservice' && !String(address || '').trim())
        return res.status(400).json(response(400, 'validasi error', 'Alamat wajib diisi untuk Home Service'))

      const service = await Service.findByPk(svcId)
      if (!service) return res.status(400).json(response(400, 'validasi error', 'Layanan tidak ditemukan'))

      const fee         = svcTyp === 'homeservice' ? HOME_SERVICE_FEE : 0
      const total_price = service.price + fee

      const booking = await Booking.create({
        id_users:         req.user.userId,
        id_services:      svcId,
        date,
        time,
        notes:            notes || '',
        status:           'pending',
        service_type:     svcTyp,
        address:          address || '',
        home_service_fee: fee,
        total_price
      })

      await Payment.create({
        id_bookings: booking.id_bookings,
        amount:      total_price,
        method:      payMet,
        status:      'unpaid'
      })

      const result = await Booking.findByPk(booking.id_bookings, { include: INCLUDE_ALL })
      return res.status(201).json(response(201, 'created', fmt(result)))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // GET /bookings/my  — booking milik customer yang login
  getMyBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        where:   { id_users: req.user.userId },
        include: INCLUDE_ALL,
        order:   [['created_at', 'DESC']]
      })
      return res.status(200).json(response(200, 'success', bookings.map(fmt)))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // GET /bookings  — semua booking (admin), pagination + filter
  getBookings: async (req, res) => {
    try {
      const page   = Number(req.query.page)  || 1
      const limit  = Number(req.query.limit) || 10
      const offset = (page - 1) * limit
      const { status, service_type, search } = req.query

      const where = {}
      if (status       && status       !== 'semua') where.status       = status
      if (service_type && service_type !== 'semua') where.service_type = service_type

      const includeWithSearch = [
        {
          model:    User, as: 'user',
          attributes: ['id_users','username','phone'],
          where:    search ? { username: { [Op.like]: `%${search}%` } } : {},
          required: !!search
        },
        { model: Service, as: 'service', attributes: ['id_services','name','price','category','duration'] },
        { model: Payment, as: 'payment' },
        { model: Review,  as: 'review'  }
      ]

      const { count, rows } = await Booking.findAndCountAll({
        where, include: includeWithSearch,
        order: [['created_at', 'DESC']], offset, limit, distinct: true
      })
      return res.status(200).json(response(200, 'success', {
        data:        rows.map(fmt),
        currentPage: page,
        totalPage:   Math.ceil(count / limit),
        total:       count,
        rangeData:   `${offset + 1}-${offset + rows.length}`
      }))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // GET /bookings/:id
  detailBooking: async (req, res) => {
    try {
      const b = await Booking.findByPk(req.params.id, { include: INCLUDE_ALL })
      if (!b) return res.status(404).json(response(404, 'booking not found'))
      return res.status(200).json(response(200, 'success', fmt(b)))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /bookings/:id/status  — admin ubah status
  updateStatus: async (req, res) => {
    try {
      const validStatus = ['pending','confirmed','in_progress','completed','cancelled']
      const { status }  = req.body
      if (!validStatus.includes(status))
        return res.status(400).json(response(400, 'validasi error', 'Status tidak valid'))

      const b = await Booking.findByPk(req.params.id)
      if (!b) return res.status(404).json(response(404, 'booking not found'))

      await Booking.update({ status }, { where: { id_bookings: req.params.id } })
      const updated = await Booking.findByPk(req.params.id, { include: INCLUDE_ALL })
      return res.status(200).json(response(200, 'updated', fmt(updated)))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /bookings/:id/cancel  — customer batalkan
  cancelBooking: async (req, res) => {
    try {
      const b = await Booking.findByPk(req.params.id)
      if (!b) return res.status(404).json(response(404, 'booking not found'))
      if (Number(b.id_users) !== req.user.userId)
        return res.status(403).json(response(403, 'forbidden'))

      await Booking.update({ status: 'cancelled' }, { where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'cancelled'))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PATCH /bookings/:id/reschedule  — customer reschedule
  // FE kirim: date, time
  rescheduleBooking: async (req, res) => {
    try {
      const { date, time } = req.body
      if (!date || !time)
        return res.status(400).json(response(400, 'validasi error', 'Tanggal dan jam wajib diisi'))

      const b = await Booking.findByPk(req.params.id)
      if (!b) return res.status(404).json(response(404, 'booking not found'))
      if (Number(b.id_users) !== req.user.userId)
        return res.status(403).json(response(403, 'forbidden'))

      await Booking.update({ date, time }, { where: { id_bookings: req.params.id } })
      const updated = await Booking.findByPk(req.params.id, { include: INCLUDE_ALL })
      return res.status(200).json(response(200, 'rescheduled', fmt(updated)))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // DELETE /bookings/:id  — admin hapus
  deleteBooking: async (req, res) => {
    try {
      await Booking.destroy({ where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'deleted'))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // POST /bookings/:id/review  — FE kirim: rating (int), comment
  addReview: async (req, res) => {
    try {
      const { rating, comment } = req.body
      if (!rating) return res.status(400).json(response(400, 'validasi error', 'Rating wajib diisi'))

      const b = await Booking.findByPk(req.params.id)
      if (!b) return res.status(404).json(response(404, 'booking not found'))
      if (Number(b.id_users) !== req.user.userId)
        return res.status(403).json(response(403, 'forbidden'))

      const rev = await Review.create({ id_bookings: Number(req.params.id), rating: Number(rating), comment: comment || '' })
      return res.status(201).json(response(201, 'created', rev))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // PUT /bookings/:id/review
  editReview: async (req, res) => {
    try {
      const { rating, comment } = req.body
      const b = await Booking.findByPk(req.params.id)
      if (!b) return res.status(404).json(response(404, 'booking not found'))
      if (Number(b.id_users) !== req.user.userId)
        return res.status(403).json(response(403, 'forbidden'))

      await Review.update({ rating: Number(rating), comment: comment || '' }, { where: { id_bookings: req.params.id } })
      const updated = await Review.findOne({ where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'updated', updated))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  },

  // DELETE /bookings/:id/review
  deleteReview: async (req, res) => {
    try {
      await Review.destroy({ where: { id_bookings: req.params.id } })
      return res.status(200).json(response(200, 'deleted'))
    } catch (e) {
      return res.status(500).json(response(500, 'server error', e.message))
    }
  }
}
