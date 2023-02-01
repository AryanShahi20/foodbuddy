// Load Environment Variables, making them accessible to across files
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const mongoose = require('mongoose')
const Patient = require('./patient')

// Connect to monogoDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'InsulinBuddy',
})
// mongoose.connection is part of the "EventEmitter" class which allows you to listen for
// events. This can be used to formulate specific responses to certain events
const db = mongoose.connection

// Exit if error detetced
db.on('error', (err) => {
    console.error(err)
    process.exit(1)
})

// Log to console once database is open
// .once() tell it to listen for it only one time
db.once('open', async () => {
    console.log(`Mongo connection started on ${db.host}:${db.port}`)
})

// Run schema files which will automatically create the collections on
// the database (if they don't exist)
require('./patient')
require('./clinician')
require('./blood_glucose_level')
require('./insulin_dose')
require('./weight')
require('./exercise')
require('./user')
require('./clinician_support_msg')
