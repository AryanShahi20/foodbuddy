// The reason why we have to import express again is because a router
// is essentially a mini application that handles a bunch of http requests

// Router for handling patient HTTP requests
const express = require('express')
const patientRouter = express.Router()

// Import controller
const patientController = require('../controllers/patient_controller')

// patient dashboard route
patientRouter.get('/', patientController.patientDashboard)

patientRouter.get('/leaderboard', patientController.leaderboard)

patientRouter.get('/patient_profile', patientController.patient_profile)

//patientRouter.post('/patient_profile/submit/', patientController.prepare_profile, patientController.change_profile)

patientRouter.get('/leaderboard_user', patientController.leaderboard_user)

patientRouter.get('/:history/add_data', patientController.add_health_data_form)

patientRouter.get('/:history', patientController.health_history)

patientRouter.post('/:history/', patientController.is_new_data_valid, patientController.add_new_health_data)

patientRouter.get('/:history/:arrow', patientController.check_arrows_active)

// Export the router
module.exports = patientRouter
