const Patient = require('../models/patient')
const Insulin_Dose = require('../models/insulin_dose')
const Blood_Glucose_Level = require('../models/blood_glucose_level')
const Weight = require('../models/weight')
const Exercise = require('../models/exercise')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const patient_id_test = '626a550b681261ec2c4e8ef0'

const aboutPage = (req, res) => {
    res.render('./about', { title: 'About', logged_in: "not_logged_in"})
}

const aboutDiabetes = (req, res) => {
    res.render('./about_diabetes', { title: 'About Diabetes', logged_in: "not_logged_in"})
}

const addDataHealthRecords = (req, res) => {
    const insulin_dose = new Insulin_Dose({
        patient_id: patient_id_test,
        doses: 3,
        comment: 'Had a really rough day today',
    })

    const blood_glucose_level = new Blood_Glucose_Level({
        patient_id: patient_id_test,
        fast: true,
        nmol_L: 4.9,
        comment: 'Fasting today',
    })

    const weight = new Weight({
        patient_id: patient_id_test,
        weight: 72,
        comment:
            'I look forward to seeing how my new exercise routine effects my weight',
    })

    const exercise = new Exercise({
        patient_id: patient_id_test,
        steps: 4682,
        comment: 'Had to help boss with transportation of goods',
    })
    insulin_dose.save()
    blood_glucose_level.save()
    weight.save()
    exercise.save()
    res.send(insulin_dose)
}

const addPatient = (req, res) => {
    const threshold1 = {
        description: 'weight',
        min: 65,
        max: 90,
    }
    const threshold2 = {
        description: 'insulin_dose',
        min: 1,
        max: 4,
    }
    const threshold3 = {
        description: 'blood_glucose_level',
        min: 5.4,
        max: 7.8,
    }
    const new_patient = new Patient({
        given_name: 'Milo',
        family_name: 'Mickey',
        email: 'MimiMickey@gmail.com',
        birth_year: 1987,
        bio: 'Just a man from NSW',
        clinical_notes: 'Patient has type 2 diabetes',
        password: 'sd()*DlDkkdN',
        clinician_id: '626a537ea997cfbf83259065',
        thresholds: [threshold1, threshold2, threshold3, threshold4],
        required_data: [
            'weight',
            'exercise',
            'insulin_dose',
            'blood_glucose_level',
        ],
    })
    new_patient
        .save()
        .then((result) => {
            res.send(new_patient)
        })
        .catch((err) => {
            console.log(err)
        })
}

const showProfile = (req, res) => {
    if(global.dashboard_route == null) {
        res.redirect('./login')
    } else {
        res.redirect('./'+ global.dashboard_route +'/' + global.dashboard_route + '_profile')
    }
}

const change_password_page = (req, res) => {
    res.render("change_password", {flash: req.flash('error'), title: "Change Password"})
}

// Middleware that checks if the new password is valid
const is_valid_password = async (req, res, next) => {

    // Min length check
    const MIN_LENGTH = 8
    if(req.body.new_password.length < MIN_LENGTH) {
        req.flash("error", "Passwords must be at least 8 characters long")
        return res.redirect("/change_password")
    }

    // Password match check
    if(req.body.new_password != req.body.new_password_repeat) {
        req.flash("error", "Passwords need to match")
        return res.redirect("/change_password")
    }

    // Current password check
    old_password = await User.findOne({user_id: global.user_id}).password
    if(req.body.new_password == old_password) {
        req.flash("error", "Password already in use")
        return res.redirect("/change_password")
    }

    // Valid password
    return next()
}

const change_password = async (req, res) => {
    // Password Salt Factor
    const SALT_FACTOR = 10

    // Hash password 
    bcrypt.hash(req.body.new_password, SALT_FACTOR, async (err, hash) => {
        if (err) {
            return next(err)
        }
        // Replace password with hash
        await User.updateOne({user_id: global.user_id}, 
                             {$set: {password: hash}})
    })
    
    if(global.user_type == "patient") {
        return res.redirect('/patient/patient_profile')
    }
    return res.redirect('/clinician/change_password')
    
}

module.exports = {
    addDataHealthRecords,
    addPatient,
    aboutPage,
    aboutDiabetes,
    showProfile,
    change_password_page,
    change_password,
    is_valid_password
}
