const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const clinical_note = new mongoose.Schema(
    {
        clinician_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        comment: {
            type: String,
            maxlength: 500,
        },
    },
    { timestamps: true }
)

const Clinical_Note = mongoose.model('clinical_note', clinical_note)
module.exports = Clinical_Note
