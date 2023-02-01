const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const weight = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        weight: {
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

const Weight = mongoose.model('weight', weight)
module.exports = Weight
