var user_type = ''
const { append } = require('express/lib/response')

// Authentication middleware
const is_authenticated = (req, res, next) => {
    // If user is not authenticated via passport, redirect to login page
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    user_type = req.user.toJSON()["type"]
    
    // Otherwise, proceed to next middleware function
    return next()
}

const redirect_user = (req, res, next) => {
    global.user_id = String(req.user.toJSON()["user_id"])
    global.user_type = String(req.user.toJSON()["type"])
    res.redirect("./"+user_type+"/")
}

const auth_failed = (req, res) => {
    res.render('login', { flash: req.flash('error'), title: 'Login', logged_in: "not_logged_in" })
}

const log_out = (req, res) => {
    req.logout()
    res.redirect('/')
    user_type = ''
}

module.exports = {
    is_authenticated,
    redirect_user,
    auth_failed,
    log_out
}