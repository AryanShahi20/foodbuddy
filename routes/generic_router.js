const express = require('express')
const genericRouter = express.Router()
const genericController = require('../controllers/generic_controller')
const authController = require('../controllers/auth_controller')

genericRouter.get('/about', genericController.aboutPage)

genericRouter.get('/about_diabetes', genericController.aboutDiabetes)

genericRouter.get('/add_health_record', genericController.addDataHealthRecords)

genericRouter.get('/add_patient', genericController.addPatient)

genericRouter.get('/profile', genericController.showProfile)

genericRouter.get('/change_password', authController.is_authenticated, genericController.change_password_page)

genericRouter.post('/change_password', genericController.is_valid_password, genericController.change_password)

module.exports = genericRouter
