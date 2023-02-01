// Router for handling clinician HTTP requests
const express = require('express')

const clinicianRouter = express.Router()

const clinicianController = require('../controllers/clinician_controller')

clinicianRouter.get('/', clinicianController.get_patient_health_records)

clinicianRouter.get('/clinician_patient', clinicianController.clinician_patient)

clinicianRouter.get('/clinician_patient/:id', clinicianController.clinician_patient)

clinicianRouter.post('/clinician_patient/:id/note', clinicianController.add_clinician_note)

clinicianRouter.post('/clinician_patient/:id/msg', clinicianController.add_support_msg)

clinicianRouter.post('/clinician_patient/:id/threshold', clinicianController.update_threshold)

clinicianRouter.get('/clinician_patient/:id/:history', clinicianController.health_history)

clinicianRouter.get('/clinician_patient/:id/:history/:arrow', clinicianController.check_arrows_active)

clinicianRouter.get('/view_all_comments', clinicianController.view_all_comments)

clinicianRouter.get('/view_all_comments/:arrow', clinicianController.check_arrows_active)

clinicianRouter.get('/new_patient', clinicianController.new_patient)

clinicianRouter.post('/new_patient/', clinicianController.is_valid_new_patient, clinicianController.add_new_patient)

clinicianRouter.get('/clinician_profile', clinicianController.clinician_profile)

clinicianRouter.get('/patient_added', clinicianController.patient_added)

clinicianRouter.get('/clinical_notes', clinicianController.clinical_notes)



clinicianRouter.get('/:arrow', clinicianController.check_arrows_active)

module.exports = clinicianRouter
