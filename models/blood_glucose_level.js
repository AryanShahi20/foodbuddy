const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const blood_glucose_level = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        nmol_L: {
            type: Number,
            required: true,
        },
        comment: {
            type: String,
            maxlength: 500,
        },
    },
    { timestamps: true }
)

const Blood_Glucose_Level = mongoose.model(
    'blood_glucose_level',
    blood_glucose_level
)
module.exports = Blood_Glucose_Level
