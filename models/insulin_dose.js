const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const insulin_dose = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        doses: {
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

const Insulin_Dose = mongoose.model('insulin_dose', insulin_dose)
module.exports = Insulin_Dose
