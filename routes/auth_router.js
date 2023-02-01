const passport = require('passport')
const express = require('express')
const auth_router = express.Router()
const auth_controller = require('../controllers/auth_controller')


// Main page which requires login to access
// Note use of authentication middleware here
auth_router.get('/', auth_controller.is_authenticated, auth_controller.redirect_user)

// Login page (with failure message displayed upon login failure)
auth_router.get('/login', auth_controller.auth_failed)

// Handle login
auth_router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/', failureRedirect: '/login', failureFlash: true
    })
)

// Handle logout
auth_router.post('/logout', auth_controller.log_out)

module.exports = auth_router