const Insulin_Dose = require('../models/insulin_dose')
const Blood_Glucose_Level = require('../models/blood_glucose_level')
const Weight = require('../models/weight')
const Exercise = require('../models/exercise')
const Clinical_Note = require('../models/clinical_note')
const Support_Msg = require('../models/clinician_support_msg')
const Patient_Record = require('../models/patient')
const User = require("../models/user")
const Patient = require("../models/patient")
const Clinician = require("../models/clinician")

var curr_page = 1
const MAX_RECORDS_ON_PAGE = 10
var MAX_PAGES = 0
var left_arrow_active = false
var right_arrow_active = true
const MAX_TIME_DELTA = 3 * 60 * 60 * 1000
const health_record_params = ["insulin_dose", "blood_glucose_level", "weight", "exercise"]
const { ObjectId } = require('mongoose')

var all_patient_comments_stored = ''


function session_valid() {
    // If someone tries to access /root/patient or /root/clinician without logging in,
    // return them to login page
    if (global.user_id == null) {
        return false
    }
    return true
}

// Handle request to see clinician's individual patient page
const clinician_patient = async (req, res) => {
    curr_page = 1
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    var patient_name = (await(Patient.findById(req.params.id))).given_name
    return res.render('clinician/clinician_options/clinician_patient', {title: 'Clinician patient',
                                                                        patient_name: patient_name,
                                                                        tick_box_state: await tick_box_states(req.params.id),
                                                                        address: "../.."})
}

function add_date(records) {
    let modified_values = []
        for(let i=0; i < records.length; i++){
            modified_values.push(records[i])
        }

        for(let i=0; i < modified_values.length; i++){
            let date1 = modified_values[i].createdAt.toLocaleTimeString()
            let date2 = modified_values[i].createdAt.toLocaleDateString()
            let date = date1 + ", " + date2
            modified_values[i].date = date
        }
    return modified_values
}

const get_threshold = (thresholds_array, health_record_type) => {
    var type = health_record_type
    if(type == "exercise") {
        type = "steps"
    }
    for (i in thresholds_array) {
        if(thresholds_array[i].description == type) {
            return thresholds_array[i]
        }
    }
}

// Handle requests to see health history
const health_history = async (req, res, next) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    var patient = (await Patient.findById(req.params.id))
    let patient_name = patient.given_name
    let thresholds_array = patient.thresholds
    //console.log(thresholds_array)
    let threshold = get_threshold(thresholds_array, req.params.history)
    
    let renders = {}
    try {
        if (req.params.history == 'blood_glucose_level') {
            const records = await Blood_Glucose_Level.find({
                patient_id: req.params.id,
            }).lean()
            records.reverse()

            modified_values = add_date(records)

            if (!records) {
                return res.sendStatus(404)
            }
            let table = generate_table_body(modified_values, 
                                            req.params.history, 
                                            threshold)

            renders = {
                title: 'Blood Glucose Level History',
                header: patient_name + '\'s Blood Glucose Level History',
                tbody: table,
                layout: 'view_data_clinician',
            }
        } else if (req.params.history == 'insulin_dose') {
            const records = await Insulin_Dose.find({
                  patient_id: req.params.id}).lean()
            records.reverse()

            modified_values = add_date(records)

            if (!records) {
                return res.sendStatus(404)
            }
            let table = generate_table_body(modified_values, 
                                            req.params.history, 
                                            threshold)

            renders = {
                title: 'Insulin Doses History',
                header: patient_name + '\'s Insulin Doses History',
                tbody: table,
                layout: 'view_data_clinician',
            }

        } else if (req.params.history == 'weight') {
            const records = await Weight.find({ patient_id: req.params.id }).lean()
            records.reverse()

            modified_values = add_date(records)

            if (!records) {
                return res.sendStatus(404)
            }

            let table = generate_table_body(modified_values, 
                                            req.params.history, 
                                            threshold)

            renders = {
                title: 'Weight History',
                header: patient_name + '\'s Weight History',
                tbody: table,
                layout: 'view_data_clinician',
            }
        } else if (req.params.history == 'exercise') {
            const records = await Exercise.find({ patient_id: req.params.id }).lean()
            records.reverse()

            modified_values = add_date(records)

            if (!records) {
                return res.sendStatus(404)
            }

            let table = generate_table_body(modified_values, 
                                            req.params.history, 
                                            threshold)

            renders = {
                title: 'Step Count History',
                header: patient_name + '\'s Step Count History',
                tbody: table,
                layout: 'view_data_clinician',
            }
        }
    } catch (err) {
        return next(err)
    }

    // page number render start
    let MAX_RECORDS = await get_model(req.params.history).count({patient_id: req.params.id})
    renders["arrows"] = return_arrow_states()
    renders["curr_page"] = curr_page
    renders["total_pages"] = Math.ceil(MAX_RECORDS/MAX_RECORDS_ON_PAGE)
    
    //renders["tbody"] = renders["tbody"].slice((curr_page-1)*MAX_RECORDS_ON_PAGE, Math.min(curr_page*MAX_RECORDS_ON_PAGE, MAX_RECORDS))
    // page number render end 


    res.render('patient/view_data/' + req.params.history, renders)
}

const generate_table_body = (records, health_record_type, thresholds) => {


    // Next page button
    let records_from_index = (curr_page - 1) * MAX_RECORDS_ON_PAGE

    // Set up table body
    let curr_page_table_body = '<tbody>'

    for(let i=0; i<records.length; i++) {
        //Make sure to only display 10 rows in table
        if (i < records_from_index) {
            continue
        } else if (i > records_from_index + MAX_RECORDS_ON_PAGE - 1) {
            break
        }

        let current_record = records[i]

        let value = ""
        switch (health_record_type) {
            case "insulin_dose":
                value = current_record.doses   
                break
            case "blood_glucose_level":
                value = current_record.nmol_L
                break
            case "exercise":
                value = current_record.steps
                break
            case "weight":
                value = current_record.weight
                break
        }
        // Parse table body for display
        let starting_tag = ""
        if(value > thresholds.max || value < thresholds.min) {
            starting_tag = '<tr class="pink">'
        }
        else {
            starting_tag = '<tr>'
        }
        field1 = '<td>' + current_record.date + '</td>'
        field2 = '<td>' + value + '</td>'
        field3 = '<td class="comments_width">' + current_record.comment + '</td>'
        curr_page_table_body += starting_tag + field1 + field2 + field3 + "</tr>"
    }
    curr_page_table_body += '</tbody>'
    return curr_page_table_body
}

// Finds the time delta between then and now (Date objects) in milliseconds, assuming then < now
function time_delta(then, now) {
    return now-then
}

async function tick_box_states(patient_id) {
    var required = (await Patient.findById(patient_id)).required_data
    let user_entered_bool = await user_entered_today(patient_id)
    let tick_boxes = {}
    const icons = {
        "insulin_dose": "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df4hp6r-135ec83f-52fa-4448-91c1-7c6983479b4d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY0aHA2ci0xMzVlYzgzZi01MmZhLTQ0NDgtOTFjMS03YzY5ODM0NzliNGQucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.C8fZTpyvrY1NHTMgOkWBbC2B0UL9BrYoaOLj6AaG_ls",
        "blood_glucose_level": "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df4hp6a-9238d58d-16f8-4006-835c-25f38fb1f0e4.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY0aHA2YS05MjM4ZDU4ZC0xNmY4LTQwMDYtODM1Yy0yNWYzOGZiMWYwZTQucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.dS51DPwQN5g3NY7SsCfuZAcGV6bUW1W-6PdfV2FVtUg",
        "weight": "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df4hp6e-70958146-bc3f-41b6-9115-c89a1504aab4.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY0aHA2ZS03MDk1ODE0Ni1iYzNmLTQxYjYtOTExNS1jODlhMTUwNGFhYjQucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.5jOroSM0WUbHGyuOlfaSZQL8BAqbZaa8mM5b7a5vIPs",
        "exercise": "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df4hp6m-e1878a25-6d84-41be-ab3b-121d6c25549d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY0aHA2bS1lMTg3OGEyNS02ZDg0LTQxYmUtYWIzYi0xMjFkNmMyNTU0OWQucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.N3jeNUbWsdyOkXfPTN_apFFCqwb0ho0pcAOinaoVII4"
    }
    for (let param of health_record_params) {
        // Only add the tick_box if the health record is required
        if(required.includes(param)) {
            tick_box_css = {}
            tick_box_css["param"] = param
            tick_box_css["name"] = function() {
                let name = param.split("_")
                let full_name = ""
                for (let word of name) {
                    full_name = full_name + word[0].toUpperCase() + word.substring(1) + " "
                }
                return full_name
            }
            tick_box_css["icon"] = icons[param]
            if (user_entered_bool[param] != true) {
                // Has entered data recently
                tick_box_css["tick_box_complete"] = "tick_box_complete"
                tick_box_css["tick_img"] = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df4hp77-98530133-39fd-4378-9d1e-885e33943fc7.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY0aHA3Ny05ODUzMDEzMy0zOWZkLTQzNzgtOWQxZS04ODVlMzM5NDNmYzcucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.wV13akX4seWYwJAT4_KjXoJGmINwcTkag6EUDOArPjM"
                tick_box_css["btn_color"] = "btn-colour-primary-dash"
            } else {
                tick_box_css["tick_box_complete"] = ""
                tick_box_css["tick_img"] = ""
                tick_box_css["btn_color"] = ""
            }
            tick_boxes[param] = tick_box_css
        }
    }

    return tick_boxes
} 

// Returns a dictionary recording boolean states of whether data has been entered recently
async function user_entered_today(patient_id) {
    const latest_patient_entries = await get_latest_patient_entries(patient_id)
    let has_entered_data = {}

    for (let param of health_record_params) {
        try {

        
        let time_now = new Date().getTime()
        let latest_entry = latest_patient_entries[param]["createdAt"]
        let time_diff = time_delta(latest_entry, time_now)
        if (time_diff > MAX_TIME_DELTA) {
            has_entered_data[param] = true
        }
        else {
            has_entered_data[param] = false
        }
        } catch {

        }
    }
    return has_entered_data
}

async function get_latest_patient_entries(_patient_id) {
    entries = {}

    for (let param of health_record_params) {
        let Model = await get_model(param)       
            try {
                entries[param] = (
                    await Model.find({ patient_id: _patient_id}).lean()
                ).reverse()[0]
            } catch(err) {
                entries[param] = ""
            }  
    }
    return entries
}

// Handle request to see add patient page
const new_patient = (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    res.render('clinician/clinician_options/new_patient', { flash: req.flash("alert"), title: 'Add new patient' })
}

async function get_all_comments() {
    
    // captures the 4 timeseries into an 2d array
    let all_timeseries = []
    try {
        let insulin = (await Insulin_Dose.find()).reverse()
        all_timeseries.push(insulin)
    } catch {

    }
    try {
        let glucose = (await Blood_Glucose_Level.find()).reverse()
        all_timeseries.push(glucose)
    } catch {
        
    }
    try {
        let weight = (await Weight.find()).reverse()
        all_timeseries.push(weight)
    } catch {
        
    }
    try {
        let exercise = (await Exercise.find()).reverse()
        all_timeseries.push(exercise)
    } catch {
        
    }
        
    // takes out all the entries from the 4 time series and stores them in a 1d array
    var sorted = []
    for(let i=0; i < all_timeseries.length; i++){
        for(let j=0; j < all_timeseries[i].length; j++){
            sorted.push(all_timeseries[i][j].toObject())
        }
    }
    try {

   
    // sorts the entries based on time with most recent entry at [0] and latest entry at [-1]
    sorted.sort(function(x, y){
        return Date.parse(y.createdAt) - Date.parse(x.createdAt)
    })
    // adds the patient name/measurement/type/date fields to each object
    for(let i=0; i < sorted.length; i++){
        let value = sorted[i].patient_id
        
        let given_name = (await Patient_Record.findById(value)).given_name
        let family_name = (await Patient.findById(value)).family_name
        let patient_name = given_name + " " + family_name
        sorted[i].name = patient_name

        let date1 = sorted[i].createdAt.toLocaleTimeString()
        let date2 = sorted[i].createdAt.toLocaleDateString()
        let date = date1 + ", " + date2
        sorted[i].date = date 
        
        if(sorted[i].steps){
            sorted[i].data_type = "Exercise"
            sorted[i].measurement = sorted[i].steps
        }
        if(sorted[i].nmol_L){
            sorted[i].data_type = "Blood Glucose Level"
            sorted[i].measurement = sorted[i].nmol_L
        }
        if(sorted[i].doses){
            sorted[i].data_type = "Insulin Doses"
            sorted[i].measurement = sorted[i].doses
        }
        if(sorted[i].weight){
            sorted[i].data_type = "Weight"
            sorted[i].measurement = sorted[i].weight
        }
    }
    //console.log(sorted[0])
    } catch {

    }
    return sorted
}

// Handle request to see comments page
const view_all_comments = async (req, res) => {
    
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    

    let comments = all_patient_comments_stored

    // page number render start
    let MAX_RECORDS = comments.length
    let renders = {}
    
    renders["arrows"] = return_arrow_states()
    renders["curr_page"] = curr_page
    renders["total_pages"] = Math.ceil(MAX_RECORDS/MAX_RECORDS_ON_PAGE)

    for(let comment of comments) {
        comment["patient_id"] = "clinician_patient/" + String(comment["patient_id"])
    }

    MAX_PAGES = renders["total_pages"]

    comments = comments.slice((curr_page-1)*MAX_RECORDS_ON_PAGE, Math.min(curr_page*MAX_RECORDS_ON_PAGE, MAX_RECORDS))
    // page number render end 

    res.render('clinician/patients_comments', {entries:comments, arrows:renders})
}

// add clinician note
const add_clinician_note = async (req, res, next) => {

    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    
    const newNote = new Clinical_Note({
        clinician_id: global.user_id,
        patient_id: '626a550b681261ec2c4e8ef0', //once individual patient pages working put reference to pateint id here
        comment: req.body.clinical_note
    })
    newNote.save( (err, result) => { 
        if (err) res.send(err)
        console.log('note Added!')
        res.redirect('/clinician/clinician_patient')
    })
}

// add support message
const add_support_msg = async (req, res, next) => {

    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    try {
        const newMsg = new Support_Msg({
            text: req.body.support_msg,
            patient_id: '626a550b681261ec2c4e8ef0', //once individual patient pages working putting reference to pateint id here
            clinician_id: user_id
        })
        newMsg.save( (err, result) => { 
            if (err) res.send(err)
            console.log('support msg Added!')
            res.redirect('/clinician')
        })
    } catch {
        
    }
    
    const newMsg = new Support_Msg({
        text: req.body.support_msg,
        patient_id: '626a550b681261ec2c4e8ef0', //once individual patient pages working putting reference to pateint id here
        clinician_id: global.user_id
    })
    newMsg.save( (err, result) => { 
        if (err) res.send(err)
        console.log('support msg Added!')
        res.redirect('/clinician/clinician_patient')
    })
    
}

const create_thresholds = (req) => {
    let required = []
    let thresholds = []   
    
    if (req.body.insulin_bool == "y"){
        let threshold_insulin = new Object()
        required.push("insulin_dose")
        threshold_insulin.description = "insulin_dose" 
        threshold_insulin.min = Number(req.body.insulin_min)
        threshold_insulin.max = Number(req.body.insulin_max)
        thresholds.push(threshold_insulin)
        console.log("success insulin")
    }

    if (req.body.glucose_bool == "y"){
        let threshold_glucose = new Object()
        required.push("blood_glucose_level")
        threshold_glucose.description = "blood_glucose_level" 
        threshold_glucose.min = req.body.glucose_min
        threshold_glucose.max = req.body.glucose_max
        thresholds.push(threshold_glucose)
        console.log("success glucose")
    }

    if (req.body.weight_bool == "y"){
        let threshold_weight = new Object()
        required.push("weight")
        threshold_weight.description = "weight" 
        threshold_weight.min = req.body.weight_min
        threshold_weight.max = req.body.weight_max
        thresholds.push(threshold_weight)
        console.log("success weight")
    }

    if (req.body.exercise_bool == "y"){
        let threshold_exercise = new Object()
        required.push("exercise")
        threshold_exercise.description = "steps" 
        threshold_exercise.min = req.body.exercise_min
        threshold_exercise.max = req.body.exercise_max
        thresholds.push(threshold_exercise)
        console.log("success exercise")
    }

    return [required, thresholds]
}

// Updates patient thresholds 
const update_threshold = async (req, res, next) => {

    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    required = create_thresholds(req)[0]
    thresholds = create_thresholds(req)[1]

    // make this = patient id once we get individual clinician_patients running 
    let cur_patient_id = '627cc5743987a11914934c36' // refers to patient "dat bickey"
    
    //var patient = await Patient.find({patient_id: cur_patient_id})
    await Patient.updateOne({_id: cur_patient_id},
        {
        $set: {thresholds: thresholds, required_data: required}
        })

    console.log("thresholds updated")
    res.redirect('/clinician/clinician_patient')
}

// Checks if the patient details are valid
const check_patient_details = (req) => {
    // Given name can't be empty
    if(req.body.gname.length == 0) {
        req.flash("alert", "Given name can't be empty")
        return false
    }

    // Given name can only be letters
    if(/^[a-zA-z\s]+$/.test(req.body.gname) == false) {
        req.flash("alert", "Given name can only be alphabetic characters")
        return false
    }

    // Family name can't be empty
    if(req.body.fname.length == 0) {
        req.flash("alert", "Family name can't be empty")
        return false
    }

    // Family name can only be letters
    if(/^[a-zA-z\s]+$/.test(req.body.fname) == false) {
        req.flash("alert", "Family name can only be alphabetic characters")
        return false
    }

    // Email can't be empty
    if(req.body.email.length == 0) {
        req.flash("alert", "Email can't be empty")
        return false
    }

    //Invalid email address
    if(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+.[a-zA-Z0-9]+$/.test(req.body.email) == false) {
        req.flash("alert", "Invalid email address")
        return false
    }

    // Birth year can't be empty
    if(req.body.year.length == 0) {
        req.flash("alert", "Birth year can't be empty")
        return false
    }

    // Birth year can only be digits and only 4 digits long
    stripped_year = req.body.year.replace(/\s+/g, '')
    if(/^\d+$/.test(stripped_year) == false || stripped_year.length != 4) {
        
        req.flash("alert", "Invalid birth year")
        return false
    }

    return true
}

const check_threshold_details = (req) => {
    
    if(check_insulin_dose_threshold(req) == false || check_blood_glucose_threshold(req) == false ||
       check_weight_threshold(req) == false || check_exercise_threshold(req) == false) {
        return false
    }
    return true
}

const check_insulin_dose_threshold = (req) => {
    // Insulin dose bool can't be empty and can only be "y" and "n"
    if(/[yn]/.test(req.body.insulin_bool) == false || req.body.insulin_bool.length != 1) {
        req.flash("alert", "Invalid response for insulin dose option")
        return false
    }
    
    if(req.body.insulin_bool == "y") {
        // Invalid input insulin for min or max
        if(/^\d+$/.test(req.body.insulin_min) == false || /^\d+$/.test(req.body.insulin_max) == false) {
            req.flash("alert", "Invalid input for insulin dose min or max")
            return false
        }

        // min can't be higher than max
        if(req.body.insulin_min > req.body.insulin_max) {
            req.flash("alert", "Insulin dose min can't be higher than max")
            return false
        }
    }
    return true
}

const check_blood_glucose_threshold = (req) => {
    // Blood glucose bool can't be empty and can only be "y" and "n"
    if(/[yn]/.test(req.body.glucose_bool) == false || req.body.glucose_bool.length != 1) {
        req.flash("alert", "Invalid response for blood glucose option")
        return false
    }

    if(req.body.glucose_bool == "y") {
        // Invalid input insulin for min or max
        if(/^[0-9]+.[0-9]+$/.test(req.body.glucose_min) == false || /^[0-9]+.[0-9]+$/.test(req.body.glucose_max) == false) {
            req.flash("alert", "Invalid input for blood glucose min or max")
            return false
        }

        // min can't be higher than max
        if(Number(req.body.glucose_min) > Number(req.body.glucose_max)) {
            req.flash("alert", "Blood glucose min can't be higher than max")
            return false
        }
    }
    return true
}

const check_weight_threshold = (req) => {
    // Weight bool can't be empty and can only be "y" and "n"
    if(/[yn]/.test(req.body.weight_bool) == false || req.body.weight_bool.length != 1) {
        req.flash("alert", "Invalid response for weight option")
        return false
    }

    if(req.body.glucose_bool == "y") {
        // Invalid input insulin for min or max
        if(/^[0-9]+.[0-9]+$/.test(req.body.weight_min) == false || /^[0-9]+.[0-9]+$/.test(req.body.weight_max) == false) {
            req.flash("alert", "Invalid input for weight min or max")
            return false
        }

        // min can't be higher than max
        if (Number(req.body.weight_min) > Number(req.body.weight_max)) {
            req.flash("alert", "Weight min can't be higher than max")
            return false
        }
    }

    // No issues
    return true
}

const check_exercise_threshold = (req) => {
    // Exercise bool can't be empty and can only be "y" and "n"
    if(/[yn]/.test(req.body.exercise_bool) == false || req.body.exercise_bool.length != 1) {
        req.flash("alert", "Invalid response for exercise option")
        return false
    }

    if(req.body.exercise_bool == "y") {
        // Invalid input insulin for min or max
        if(/^\d+$/.test(req.body.exercise_min) == false || /^\d+$/.test(req.body.exercise_max) == false) {
            req.flash("alert", "Invalid input for weight min or max")
            return false
        }

        // min can't be higher than max
        if(req.body.weight_min > req.body.weight_max) {
            req.flash("alert", "Exercise min can't be higher than max")
            return false
        }
    }

    return true
}

// Middleware to validate new patients
const is_valid_new_patient = async (req, res, next) => {
    if(check_patient_details(req) == false) {
        console.log("something failed 1")
        return res.redirect(".")
    }
    else {
        if(check_threshold_details(req) == false) {
            console.log("something failed 2")
            return res.redirect(".")
        }
    }

    // Check is email is in use
    const emails = await User.find({}, {username: true})
    if (emails.includes(req.body.email)) {
        req.flash("alert", "Email already in use")
        return res.redirect(".")
    }

    console.log("patient details all valid")
    // All details are valid
    return next()
} 

// insert new patient into collection
const add_new_patient = async (req, res, next) => {

    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    
    // Create thresholds
    threshold_info = create_thresholds(req)
    let required = threshold_info[0]
    let thresholds = threshold_info[1]
    
    // Create new patient
    const newPatient = new Patient_Record({
        given_name: req.body.gname,
        family_name: req.body.fname,
        email: req.body.email,
        birth_year: req.body.year,
        clinician_id: global.user_id,
        thresholds: thresholds,
        required_data: required
    })
    await newPatient.save( (err, result) => { // callback-style error-handler
        if (err) return res.send(err)
        console.log('Patient Added!')
    })
    
    // Get patient ID
    const patient_id = await Patient.findOne({email: req.body.email}._id).toString()
    
    // Add new usergenerate
    const newUser = new User({
        username: req.body.email,
        password: generate_random_string(),
        type: "patient",
        secret: generate_random_string(),
        user_id: patient_id
    })
    newUser.save( (err, result) => { // callback-style error-handler
        if (err) return res.send(err)
        console.log('User Added!')
        return res.redirect('/clinician/patient_added')
    })
}

// Helper function for generating a random string
// Referenced from https://www.geeksforgeeks.org/how-to-generate-a-random-password-using-javascript/
const generate_random_string = () => {
    var random_string = "";
    var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + 
            "abcdefghijklmnopqrstuvwxyz0123456789@#$";
        
    for (let i = 1; i <= 8; i++) {
        var char = Math.floor(Math.random() * str.length + 1);      
        random_string += str.charAt(char)
    }
        
    return random_string;
}

// Handle request to see previous clinical notes
const clinical_notes = async (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    // captures the notes for a patient into an array
    let notes = []
    let patient_id = '626a550b681261ec2c4e8ef0' //replace this with the variable signifying patient id once clinician_patient working
    let patient_notes = await Clinical_Note.find({patient_id: patient_id},{})
    notes.push(patient_notes)


    let modified_notes = []
    for(let i=0; i < notes[0].length; i++){
        modified_notes.push(notes[0][i].toObject())
    }

    // sorts the entries based on time with most recent entry at [0] and latest entry at [-1]
    modified_notes.sort(function(x, y){
        return Date.parse(y.createdAt) - Date.parse(x.createdAt)
    })

    
    // adds the date to each object
    for(let i=0; i < modified_notes.length; i++){
        
        let date1 = modified_notes[i].createdAt.toLocaleTimeString()
        let date2 = modified_notes[i].createdAt.toLocaleDateString()
        let date = date1 + ", " + date2
        modified_notes[i].date = date
        
        let given_name = (await Patient_Record.findById(patient_id)).given_name
        let family_name = (await Patient.findById(patient_id)).family_name
        var patient_name = given_name + " " + family_name
    }


    res.render('clinician/clinician_options/clinical_notes', {entries: modified_notes, patient_name: patient_name})
}

// Handle request to see clinician profile page
const clinician_profile = async (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    let clinician = await Clinician.findById(global.user_id)
    let user = (await User.find({user_id: global.user_id}))[0]

    let renders = {
        "gname": clinician["given_name"],
        "fname": clinician["family_name"],
        "email": clinician["email"],
        "user": user["username"],
        "byear": clinician["birth_year"],
        "bio": clinician["bio"]
    }

    res.render('clinician/clinician_options/clinician_profile', { title: 'Clinician profile', profile: renders })
}

// Handle request to see clinician profile page
const patient_added = (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    res.render('clinician/clinician_options/patient_added', { title: 'Add patient success' })
}

// Handle request to see the clinician dashboard
const get_patient_health_records = async (req, res, next) => {
    
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    global.dashboard_route = "clinician"
    try {
        const patient_record = await Patient_Record.find({clinician_id: global.user_id}).lean()
        const PATIENT_COUNT = await Patient_Record.count({clinician_id: global.user_id})

        // Allow for paging of data
        MAX_PAGES = Math.floor(PATIENT_COUNT / MAX_RECORDS_ON_PAGE) + 1
        // Next page button
        let records_from_index = (curr_page - 1) * MAX_RECORDS_ON_PAGE

        // Set up table body
        let curr_page_table_body = '<tbody>'

        for (let current_patient_index in patient_record) {

            // Make sure to only display 10 rows in table
            if (current_patient_index < records_from_index) {
                continue
            } else if (
                current_patient_index >
                records_from_index + MAX_RECORDS_ON_PAGE - 1
            ) {
                break
            }

            // Get relevant data
            let current_patient = patient_record[current_patient_index]

            let latest_patient_entries = await get_latest_patient_entries(current_patient['_id'])
            let numeric_values = await get_numerical_data_values(latest_patient_entries)
            let patient_critical_record = await get_critical_for_patient(current_patient, latest_patient_entries)
            let patient_incomplete = await get_incomplete_for_patient(current_patient['_id'])
            let is_monitored = await get_is_monitored(current_patient['_id'])

            let table_string = ""
            
            table_string += "<tr>"   
            // Set up table column
            let patient_name =
                current_patient['given_name'] +
                ' ' +
                current_patient['family_name']
            // Put information into columns
            let row_patient_name = '<td>' + '<a href="clinician_patient/' + current_patient._id.toString() + '/">' + patient_name + '</a>' + '</td>'
            table_string += row_patient_name
            
            // Parse table body for display
            for (let param of health_record_params) {
                column_text = get_header(param, patient_critical_record, patient_incomplete, is_monitored)
                body_text = numeric_values[param]
                table_string += column_text + body_text + "</td>"
            }
            table_string += "</tr>"
            curr_page_table_body += table_string
        }
        curr_page_table_body += '</tbody>'

        if (all_patient_comments_stored == '') {
            all_patient_comments_stored = await get_all_comments()
        }
        
        //console.log(all_patient_comments_stored)

        res.render('clinician/clinician_dashboard', {
            title: 'Clinician Dashboard',
            curr_page: curr_page,
            total_pages: MAX_PAGES,
            arrows: return_arrow_states(),
            tbody: curr_page_table_body,
            entries: all_patient_comments_stored,
            hide: "clinician_hide"
        })
    } catch (err) {
        return next(err)
    }
}

const individual_patient_reocrds = async (req, res) => {

}

function get_model(record_type) {
    var Model = ""
    switch (record_type) {
        case "insulin_dose":
            var Model = Insulin_Dose
            break;
        case "blood_glucose_level":
            var Model = Blood_Glucose_Level
            break;
        case "exercise":
            var Model = Exercise
            break;
        case "weight":
            var Model = Weight
            break;
        default:
            break;
    }
    return Model
}

async function get_latest_patient_entries(_patient_id) {
    entries = {}

    for (let param of health_record_params) {
        let Model = await get_model(param)       
            try {
                entries[param] = (
                    await Model.find({ patient_id: _patient_id}).lean()
                ).reverse()[0]
            } catch(err) {
                entries[param] = ""
            }  
    }
    return entries
}

async function get_numerical_data_values(latest_patient_entries) {
    let numeric_data_values = {}
    for (let param of health_record_params) {

        var subparam = ""

        switch (param) {
            case "insulin_dose":
                var subparam = "doses"
                break;
            case "blood_glucose_level":
                var subparam = "nmol_L"
                break;
            case "exercise":
                var subparam = "steps"
                break;
            case "weight":
                var subparam = "weight"
                break;
            default:
                break;
        }
        try {
            numeric_data_values[param] = latest_patient_entries[param][subparam]
        }
        catch(err) {
            numeric_data_values[param] = ""
        }
        

    }

    return numeric_data_values
}

async function detect_critical(patient, record_type, latest_patient_entries) {

    var threshold = ""
    var param = ""
    switch (record_type) {
        case "insulin_dose":
            var threshold = patient["thresholds"][1]
            var param = "doses"
            break;
        case "blood_glucose_level":
            var threshold = patient["thresholds"][2]
            var param = "nmol_L"
            break;
        case "exercise":
            var threshold = patient["thresholds"][3]
            var param = "steps"
            break;
        case "weight":
            var threshold = patient["thresholds"][0]
            var param = "weight"
            break;
        default:
            break;
    }
    var is_critical = ''
    
    if (latest_patient_entries[record_type] != "") {
        try {
            is_critical = Boolean(
                latest_patient_entries[record_type][param] > threshold.max ||
                latest_patient_entries[record_type][param] < threshold.min
            )
        }
        catch(err) {
            is_critical = ''
        }
        
    }
    return is_critical
}

async function get_critical_for_patient(patient, latest_patient_entries) {
    critical_info = {}
    for (let param of health_record_params) {
        critical_info[param] = await detect_critical(patient, param, latest_patient_entries)
    }
    return critical_info
}

async function get_incomplete_for_patient(patient_id) {
    let patient_incomplete = {}
    for(let param of health_record_params) {

        try {
            let Model = await get_model(param)
            let curr_record = (await Model.find({patient_id: patient_id}).lean()).reverse()
            if(curr_record.length == 0) {
                patient_incomplete[param] = true
            } else {
                let time_now = new Date().getTime()
                patient_incomplete[param] = Boolean((time_delta(curr_record[0]["createdAt"], time_now) > 24*60*60*1000))
            }
        } catch {
            patient_incomplete[param] = true
        }
    }   
    
    return patient_incomplete
}

async function get_is_monitored(patient_id) {
    let patient = await Patient.findById(patient_id)
    return patient["required_data"]
}

function get_header(health_record, patient_critical_record, patient_incomplete, is_monitored) {

    let curr_column = ""
    if (is_monitored.indexOf(health_record) == -1) {
        curr_column += '<td style="background-color: white;">'
    } else if (patient_incomplete[health_record]) {
        curr_column += '<td class="grey">'
    } else if (patient_critical_record[health_record]) {
        curr_column += '<td class="pink">'
    } else {
        curr_column += '<td style="background-color: var(--colour-primary-tint);">'
    }
    return curr_column
}

const check_arrows_active = (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("/login")
        return
    }
    let arrow = req.params.arrow
    if (arrow == 'left') {
        curr_page -= 1
    } else {
        curr_page += 1
    }
    if (curr_page == 1) {
        left_arrow_active = false
        right_arrow_active = true
    } else if (curr_page == MAX_PAGES) {
        left_arrow_active = true
        right_arrow_active = false
    } else {
        left_arrow_active = true
        right_arrow_active = true
    }
    // Refreshes page to update the data.
    return res.redirect('./')
}

function return_arrow_states() {
    let left = ''
    let right = ''
    if (left_arrow_active == true) {
        left = '< '
    }
    if (right_arrow_active == true) {
        right = ' >'
    }
    if (MAX_PAGES == 1) {
        right = ''
        right_arrow_active = false
    }
    let arrows = { left: left, right: right }
    return arrows
}

module.exports = {
    get_patient_health_records,
    check_arrows_active,
    clinician_patient,
    new_patient,
    view_all_comments,
    add_clinician_note,
    add_support_msg,
    update_threshold,
    add_new_patient,
    clinician_profile,
    patient_added,
    clinical_notes,
    is_valid_new_patient,
    individual_patient_reocrds,
    health_history
}
