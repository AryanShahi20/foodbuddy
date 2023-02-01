const mongoose = require('mongoose')
const Schema = mongoose.Schema()

const exercise = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        steps: {
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

const Exercise = mongoose.model('exercise', exercise)
module.exports = Exercise
