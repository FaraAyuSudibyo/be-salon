const express        = require('express')
const router         = express.Router()
const upload         = require('../middlewares/upload')
const { verifyAdmin } = require('../middlewares/auth')
const ctrl           = require('../controllers/service.controller')

router.get('/',      ctrl.getService)
router.get('/:id',   ctrl.detailService)
router.post('/',     verifyAdmin, upload.single('image'), ctrl.createService)
router.put('/:id',   verifyAdmin, upload.single('image'), ctrl.updateService)
router.delete('/:id',verifyAdmin, ctrl.deleteService)

module.exports = router
