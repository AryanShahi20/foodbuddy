// Import express and handlebars
const express = require('express')
const exphbs = require('express-handlebars')

const app = express()

app.engine(
    'hbs',
    exphbs.engine({
        defaultLayout: 'main',
        extname: 'hbs',
    })
)

// Require will read & execute the 'index' file and return the exports object
require('./models/index')

// Listen to the port assigned by heroku or local port 3000
app.listen(process.env.PORT || 3000, () => {
    console.log('App initiation complete')
})

// Specify where the static files are
app.use(express.static('public'))

// This takes all the urlencoded data (e.g. The names on each element inside
// a form) and parses it onto an object that can be used in the 'req' object
app.use(express.urlencoded({ extended: true }))

// The server needs a view engine to be able to render the code
// Tells app to use handlebars as the view engine
app.set('view engine', 'hbs')

// Import routers
const genericRouter = require('./routes/generic_router')
const patientRouter = require('./routes/patient_router')
const clinicianRouter = require('./routes/clinician_router')

// We are effectively saying, any route that starts with '/patient'
// add all the routes specified by patientRouter to the end of it

const flash = require('express-flash')
const session = require('express-session')

// Flash messages for failed logins, and (possibly) other success/error messages
app.use(flash())

// Track authenticated users through login sessions
app.use(
    session({
        // The secret used to sign session cookies (ADD ENV VAR)
        secret: process.env.SESSION_SECRET || 'keyboard cat',
        name: 'demo', // The cookie name (CHANGE THIS)
        saveUninitialized: false,
        resave: false,
        cookie: {
            sameSite: 'strict',
            httpOnly: true,
            secure: app.get('env') === 'production'
        },
    })
)

if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // Trust first proxy
}

// Initialise Passport.js
const passport = require('./passport')
app.use(passport.authenticate('session'))

// Load authentication router
const authRouter = require('./routes/auth_router')
app.use(authRouter)

// use favicon
app.use('/favicon.ico', express.static('./public/icons/favicon.ico'));


app.use('/patient', patientRouter)
app.use('/clinician', clinicianRouter)
app.use('/', genericRouter)
