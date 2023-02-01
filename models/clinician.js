const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const clinician = new mongoose.Schema({
    given_name: {
        type: String,
        required: true,
        maxlength: 40,
    },
    family_name: {
        type: String,
        required: true,
        maxlength: 40,
    },
    email: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        maxlength: 100,
    },
    patient_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
    }
})

const Clinician = mongoose.model('clinician', clinician)
module.exports = Clinician
