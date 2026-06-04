const express = require('express')
const router  = express.Router()
const upload  = require('../middlewares/upload')
const ctrl    = require('../controllers/profile.controller')

router.get('/',                   ctrl.getProfile)
router.put('/',    upload.none(), ctrl.updateProfile)
router.patch('/change-password', upload.none(), ctrl.changePassword)

module.exports = router
