const mongoose = require('mongoose')
const Schema = mongoose.Schema()
const { Double } = require('mongodb')

const engagement = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    join_date: {
        type: mongoose.Schema.Types.Date,
        required: true,
    },
    no_records: {
        type: Number,
        required: true,
    },
    engagement_rate: {
        type: Number,
        required:true,

    }
})

const Engagement = mongoose.model('engagement', engagement)
module.exports = Engagement
