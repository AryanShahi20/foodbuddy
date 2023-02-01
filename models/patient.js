const { Double } = require('mongodb')
const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const safety_threshold = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    min: {
        type: Number,
        required: true,
    },
    max: {
        type: Number,
        required: true,
    },
})

const patient = new mongoose.Schema({
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
    birth_year: {
        type: Number,
        required: true,
        maxLength: 4,
        minlength: 4,
    },
    bio: {
        type: String,
        maxlength: 100,
    },
    clinical_notes: {
        type: String,
        maxlength: 200,
    },
    clinician_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    thresholds: [safety_threshold],
    required_data: {
        type: [String],
        maxLength: 4,
        required: true,
    }
})

// Turn 'Patient' schema into a model and create the 'Patients'
// collection on the database
const Patient = mongoose.model('patient', patient)

// export model
module.exports = Patient
