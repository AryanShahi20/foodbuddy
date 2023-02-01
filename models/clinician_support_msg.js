const mongoose = require('mongoose')

const clinician_support_msg = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        patient_id: {
            type: String,
            required: true
        },
        clinician_id: {
            type: String,
            required: true
        },
    },
    { timestamps: true }
)

const Clinician_Support_Msg = mongoose.model('clinician_support_msg', clinician_support_msg)
module.exports = Clinician_Support_Msg
