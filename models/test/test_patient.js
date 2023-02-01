// Models allows us to communicate with the database collection
// to retrieve our desired data

const mongoose = require('mongoose')
// Schema is a constructor function that we'll use to make a new database schema
const Schema = mongoose.Schema

const patientSchema = new Schema(
    {
        first_name: {
            type: String,
            required: true,
        },
        last_name: {
            type: String,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
)

// The schema is what defines the document's structure. The model is what surrounds it and provides
// an interface for communicating with a database collection of that document type
//
// Mongoose will take the first parameter, pluralise it and looks for the corresponding
// collection inside the database whenever we use this model to communicate with the database.
//
// Whenever we use the variable 'Patient', it'll automatically look for the Patients collection
//
// The second parameter is the schema we want to use
const Patient = mongoose.model('Patient', patientSchema)

// This model comes with a number of methods that help us with getting and setting data in our
// database

module.exports = Patient

// Connect to the mongoDB using the MONGO_URL environment variable
// Locally, MONGO_URL will be loaded by dotenv from .env
mongoose
    .connect(process.env.MONGO_URL || 'mongodb://localhost', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'InsulinBuddy',
    })
    .then((result) => console.log('Connected to the db'))
    .catch((err) => console.log(err))

// // Exit database if error detected
// const db = mongoose.connection.on('error', err => {
//     console.error(err);
//     process.exit(1)
// })

// // Lon to console once the database is open
// db.once('open', async () => {
//     console.log('Mongo connection started on ${db.host}: ${db.port}')
// })
