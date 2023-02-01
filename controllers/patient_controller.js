const Patient = require('../models/patient')
const Insulin_Dose = require('../models/insulin_dose')
const Blood_Glucose_Level = require('../models/blood_glucose_level')
const Weight = require('../models/weight')
const Exercise = require('../models/exercise')
const Clinician_Support_Msg = require('../models/clinician_support_msg')
const Clinician = require("../models/clinician")
const Engagement = require("../models/engagement")
const User = require("../models/user")

// The categories of health records
const health_record_params = ["insulin_dose", "blood_glucose_level", "weight", "exercise"]

const MAX_TIME_DELTA = 3 * 60 * 60 * 1000 // Hours * Minutes * Seconds * Milliseconds ---- Change this later

var curr_page = 1
const MAX_RECORDS_ON_PAGE = 5
var MAX_PAGES = 0
var left_arrow_active = false
var right_arrow_active = true


function session_valid() {
    // If someone tries to access /root/patient or /root/clinician without logging in,
    // return them to login page
    if (global.user_id == null) {
        return false
    }
    return true
}

// Handle request to see patient dashboard
const patientDashboard = async (req, res, next) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    curr_page = 1

    global.dashboard_route = "patient"
    const patient = await Patient.findById(global.user_id)
    const patient_name = patient.given_name

    // Pull most recent clinician comment
    console.log("Logged in as: " + global.user_id)
    try {
        var support_msg = await Clinician_Support_Msg.find({patient_id: global.user_id})
        var support_msg = ((support_msg.reverse())[0])
        var support_msg_text = support_msg.text


        let date1 = support_msg.createdAt.toLocaleTimeString()
        let date2 = support_msg.createdAt.toLocaleDateString()
        var date = date1 + ", " + date2

        support_msg_text = support_msg.text

        // Find the name of the clinician who made the comment
        var clinician_id = support_msg.clinician_id
        var clinician = await Clinician.findById(clinician_id)
        var last_name = clinician.family_name


        
    } catch {

    }
    let the_leaderboard = await get_leaderboard()


    res.render('patient/patient_dashboard', {
        title: 'Patient Dashboard',
        patient_name: patient_name,
        tick_box_state: await tick_box_states(),
        msg: support_msg_text,
        date: date,
        doctor_last_name: last_name,
        engagement : the_leaderboard[0], 
        my_info:the_leaderboard[1],
    })
}

async function get_leaderboard() {
    const patient = await Patient.findById(global.user_id)
    const user = await User.find({user_id: global.user_id})
    var user_engagement = await Engagement.find({patient_id: global.user_id})
    if (user_engagement.length == 0) {
        // If this user hasn't made a record yet
        await create_new_user(patient["required_data"].length)
        
    }
    user_engagement = await Engagement.find({patient_id: global.user_id})
    all_engagement = (await Engagement.find().sort({engagement_rate:0})).reverse()


    const BADGE_SILVER = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df59xpx-8923d65e-ee2e-4c1b-bfa4-81ab5386e25a.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY1OXhweC04OTIzZDY1ZS1lZTJlLTRjMWItYmZhNC04MWFiNTM4NmUyNWEucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.MZBuFaMgsSf8q9XNhM3WuSKx3XQpo2XJ4Ep5sfs6mWM"
    const BADGE_GOLD = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9efb134c-4fb5-49a4-8702-6128f4b45dc6/df59xpt-1164a5e8-cb99-460d-9537-28d0a94b4b6a.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzllZmIxMzRjLTRmYjUtNDlhNC04NzAyLTYxMjhmNGI0NWRjNlwvZGY1OXhwdC0xMTY0YTVlOC1jYjk5LTQ2MGQtOTUzNy0yOGQwYTk0YjRiNmEucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.1DeMd-TFi_jrRdFAg8pU84W6D-LEj5k6dwzDZNfEtRc"
    let my_engagement = {}
    if (user_engagement.length == 0) {
        // Still nothing, then return nothing
        my_engagement = {
            "rank": "??",
            "name": "Make an entry and you will appear here!",
            "rate": "??",
            "badge": BADGE_SILVER
        }
    } else {
        let badge = ''
        if ((user_engagement[0]["engagement_rate"]*100) > 80) {
            badge = BADGE_GOLD
        } else {
            badge = BADGE_SILVER
        }
        my_engagement = {
            "rank": function get_rank() {
                let j = 1
                for(let i in all_engagement) {
                    if(all_engagement[i]["patient_id"] == global.user_id) {
                        return j
                    }
                    j++
                }
            },
            "name": user[0]["username"],
            "rate": (user_engagement[0]["engagement_rate"]*100).toFixed(2),
            "badge": badge
        }
    }

    let eng = {}
    let i = 1
    let MAX_LEADERBOARD = 6;
    for(let p in all_engagement) {
        try {

        
        let curr_p = await Patient.findById(all_engagement[p]["patient_id"])
        let curr_u = await User.find({user_id: String(all_engagement[p]["patient_id"])})
        if ((all_engagement[p]["engagement_rate"]*100) > 80) {
            badge = BADGE_GOLD
        } else {
            badge = BADGE_SILVER
        }
        let curr_eng = {
            "rank": i,
            "name": curr_u[0]["username"],
            "rate": (all_engagement[p]["engagement_rate"]*100).toFixed(2),
            "badge": badge
        }
        eng[String(all_engagement[p]["patient_id"])] = curr_eng
        i++
        if(i==MAX_LEADERBOARD) {
            break
        }
        } catch {
            continue
        }
    }

    return [eng, my_engagement]

}


async function create_new_user(required_data_len) {
    // user not in db.
    // Create user.

    let count_patient_entries = await count_patient_entries_all(global.user_id)
    let patient_participation = count_patient_entries["insulin_dose"] +
                                count_patient_entries["blood_glucose_level"] +
                                count_patient_entries["weight"] +
                                count_patient_entries["exercise"]

    let join_date = await get_join_date() // Can be '' if patient hasnt made any entries

    if(join_date != '') {
        // Only make the user if they have recorded data ever.
        let time_now = new Date().getTime()
        let days_since_start = time_delta(join_date, time_now)/24/60/60/1000
        var my_engagement_rate = patient_participation / (required_data_len * days_since_start)

        const new_user = new Engagement({
            patient_id: global.user_id,
            join_date: join_date, 
            no_records: patient_participation,
            engagement_rate: my_engagement_rate,
        })
        new_user.save()
    }
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

async function count_patient_entries_all(_patient_id) {
    entries = {}

    for (let param of health_record_params) {
        let Model = await get_model(param)       
            try {
                entries[param] = (
                    await Model.count({patient_id: _patient_id}).lean()
                )
            } catch(err) {
                entries[param] = 0
            }  
    }
    return entries
}

// Returns a dictionary recording boolean states of whether data has been entered recently
async function user_entered_today() {
    const latest_patient_entries = await get_latest_patient_entries(global.user_id)
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
            continue
        }
        
    }
    return has_entered_data
}

// Finds the time delta between then and now (Date objects) in milliseconds, assuming then < now
function time_delta(then, now) {
    return now-then
}

async function tick_box_states() {
    let required = (await Patient.findById(global.user_id)).required_data
    let user_entered_bool = await user_entered_today()
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

// Handle request to see leaderboard
const leaderboard = async (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }

    let the_leaderboard = await get_leaderboard()
    
    res.render('patient/profile/leaderboard', { title: 'Leaderboard',engagement : the_leaderboard[0], 
    my_info:the_leaderboard[1]})
}

async function get_join_date() {
    let earliest = ''
    for (let param of health_record_params) {
        let Model = await get_model(param)       
        try {
            
            date = (
                (await Model.find({patient_id: global.user_id}).lean())
            )[0]["createdAt"]
            
            if(earliest == '') {
                earliest = date
            }
            if(date < earliest) {
                earlierst = date
            }
        } catch {
            continue;
        }  
    }
    return earliest
}

// Handle request to see patient profile
const patient_profile = async (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    let patient = await Patient.findById(global.user_id)
    let user = (await User.find({user_id: global.user_id}))[0]

    let renders = {
        "gname": patient["given_name"],
        "fname": patient["family_name"],
        "email": patient["email"],
        "user": user["username"],
        "byear": patient["birth_year"],
        "bio": patient["bio"]
    }
    


    res.render('patient/profile/patient_profile', { title: 'Patient profile', profile: renders })
}

// Handle request to see other user from leaderboard
const leaderboard_user = (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    

    res.render('patient/profile/leaderboard_user', { title: 'Other user profile' })
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

    var patient = (await Patient.findById(global.user_id))
    let thresholds_array = patient.thresholds
    let threshold = get_threshold(thresholds_array, req.params.history)

    try {
        var renders = ''
        if (req.params.history == 'blood_glucose_level') {
            const records = await Blood_Glucose_Level.find({
                patient_id: global.user_id,
            }).lean()
            records.reverse()

            modified_values = add_date(records)

            let table = generate_table_body(modified_values, 
                req.params.history, 
                threshold)

            if (!records) {
                return res.sendStatus(404)
            }
            renders = {
                title: 'Blood Glucose Level History',
                header: 'Blood Glucose Level History',
                tbody: table,
                layout: 'view_data',

            }

        } else if (req.params.history == 'insulin_dose') {
            const records = await Insulin_Dose.find({
                patient_id: global.user_id,
            }).lean()
            records.reverse()

            modified_values = add_date(records)

            let table = generate_table_body(modified_values, 
                req.params.history, 
                threshold)
            
            if (!records) {
                return res.sendStatus(404)
            }
            renders = {
                title: 'Insulin Doses History',
                header: 'Insulin Doses History',
                tbody: table,
                layout: 'view_data',
            }

        } else if (req.params.history == 'weight') {
            const records = await Weight.find({ patient_id: global.user_id }).lean()
            records.reverse()

            modified_values = add_date(records)

            let table = generate_table_body(modified_values, 
                req.params.history, 
                threshold)

            if (!records) {
                return res.sendStatus(404)
            }
            renders = {
                title: 'Weight History',
                header: 'Weight History',
                tbody: table,
                layout: 'view_data',
            }

        } else if (req.params.history == 'exercise') {
            const records = await Exercise.find({ patient_id: global.user_id }).lean()
            records.reverse()

            modified_values = add_date(records)

            let table = generate_table_body(modified_values, 
                req.params.history, 
                threshold)

            if (!records) {
                return res.sendStatus(404)
            }
            renders = {
                title: 'Step Count History',
                header: 'Step Count History',
                tbody: table,
                layout: 'view_data',
            }
            
        }
    } catch (err) {
        return next(err)
    }
    console.log()
    // page number render start
    let MAX_RECORDS = await get_model(req.params.history).count()
    renders["arrows"] = return_arrow_states()
    renders["curr_page"] = curr_page
    renders["total_pages"] = Math.ceil(MAX_RECORDS/MAX_RECORDS_ON_PAGE)
    
    //renders["data"] = renders["data"].slice((curr_page-1)*MAX_RECORDS_ON_PAGE, Math.min(curr_page*MAX_RECORDS_ON_PAGE, MAX_RECORDS))
    // page number render end 

    res.render('patient/view_data/' + req.params.history, renders)
}

const generate_table_body = (records, health_record_type, thresholds) => {
    console.log(thresholds)

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

// Middleware for input validation of a new time series
const is_new_data_valid = (req, res, next) => {
    if(req.params.history == "blood_glucose_level" || req.params.history == "weight") {
        if(/^[0-9]+.[0-9]+$/.test(req.body.field) == false) {
            req.flash("alert", "Invalid Input")
            return res.redirect("add_data")
        }
    }

    if(req.params.history == "insulin_dose" || req.params.history == "steps") {
        if(/^\d+$/.test(req.body.field) == false) {
            req.flash("alert", "Invalid Input")
            return res.redirect("add_data")
        }
    }

    // Field can't be empty
    if(req.body.field.length == 0) {
        req.flash("alert", "Data field can't be empty")
        return res.redirect("add_data")
    }

    // Maximum length of comment
    if(req.body.comment.length > 500) {
        req.flash("alert", "Maximum comment length is 500 characters")
        return res.redirect("add_data")
    }
    
    // Input is valid
    return next();
}

const prepare_profile = (req, res) => {
    return next();
}

const change_profile = (req, res) => {
    //console.log(req.body.email)

}

// Handle requests to view add data page
const add_health_data_form = (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    
    let renders = ''

    if (req.params.history == 'blood_glucose_level') {

        renders = {
            header: 'Enter Your Blood Glucose Level',
            data_label: 'Blood Glucose Level (nmol/L)',
            name: 'bloodGlucose',
            layout: 'add_data',
            flash: req.flash("alert")
        }
    } else if (req.params.history == 'insulin_dose') {

        renders = {
            header: 'Enter Your Insulin Doses',
            data_label: 'Number of Insulin Doses',
            name: 'insulinDoses',
            layout: 'add_data',
            flash: req.flash("alert")
        }
    } else if (req.params.history == 'weight') {

        renders = {
            header: 'Enter Your Weight(Kg)',
            data_label: 'Weight(kg)',
            name: 'weight',
            layout: 'add_data',
            flash: req.flash("alert")
        }
    } else if (req.params.history == 'exercise') {
        
        renders =  {
            header: 'Enter Your Step Count',
            data_label: 'Number of Steps',
            name: 'stepCount',
            layout: 'add_data',
            flash: req.flash("alert")
        }
    }
    
    res.render('patient/add_data/add_generic', renders)
}

// Handle requests to add new health data
const add_new_health_data = async (req, res, next) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
        return
    }
    try {
        // Extract relevent data and create new entry
        if (req.params.history == 'blood_glucose_level') {
            const blood_glucose_level = new Blood_Glucose_Level({
                patient_id: global.user_id,
                fast: req.body.accept,
                nmol_L: Number(req.body.field),
                comment: req.body.comment,
            })

            blood_glucose_level
                .save()
                .then((result) => {
                    console.log('Exercises updated succesfully')
                    res.redirect('.')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else if (req.params.history == 'insulin_dose') {
            const insulin_dose = new Insulin_Dose({
                patient_id: global.user_id,
                doses: Number(req.body.field),
                comment: req.body.comment,
            })

            insulin_dose
                .save()
                .then((result) => {
                    console.log('Exercises updated succesfully')
                    res.redirect('.')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else if (req.params.history == 'weight') {
            const weight = new Weight({
                patient_id: global.user_id,
                weight: Number(req.body.field),
                comment: req.body.comment,
            })

            weight
                .save()
                .then((result) => {
                    console.log('Exercises updated succesfully')
                    res.redirect('.')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else if (req.params.history == 'exercise') {
            const exercise = new Exercise({
                patient_id: global.user_id,
                steps: Number(req.body.field),
                comment: req.body.comment,
            })

            exercise
                .save()
                .then((result) => {
                    console.log('Exercises updated succesfully')
                    res.redirect('.')
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        // Once added, also update the patient's engagement rate
        let user_engagement = await Engagement.find({patient_id: global.user_id})
        let patient = await Patient.findById(global.user_id)
        if(user_engagement.length == 0) {
            // If user doesnt exist yet create
            await create_new_user((patient["required_data"]).length)
        } else {
            // Update
            let new_no_records = user_engagement[0]["no_records"]+1

            let time_now = new Date().getTime()
            let days_since_start = time_delta( user_engagement[0]["join_date"], time_now)/24/60/60/1000
            let new_engagement_rate = Math.min(new_no_records / ((patient["required_data"]).length * days_since_start), 90)

            await Engagement.updateOne(
                {"patient_id": global.user_id},
                {$set: {"no_records": new_no_records, "engagement_rate": new_engagement_rate}}
            )
        }

    } catch (err) {
        return next(err)
    }
}

const check_arrows_active = (req, res) => {
    if (!session_valid()) {
        // Invalid session, return to login screen
        res.redirect("../login")
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


// Export functions
module.exports = {
    patientDashboard,
    leaderboard,
    health_history,
    add_new_health_data,
    add_health_data_form,
    patient_profile,
    leaderboard_user,
    check_arrows_active,
    is_new_data_valid,
    change_profile,
    prepare_profile
}






    // Code for initialising the engagement collection
    // var all_patients = await Patient.find()
    // for(let patientt of all_patients) {
        
    //     var user_engagement = await Engagement.find({patient_id: patientt["_id"]})
        
    //     if (user_engagement.length == 0) {
    //         let count_patient_entries = await count_patient_entries_all(patientt["_id"])
            
    //         let patient_participation = count_patient_entries["insulin_dose"] +
    //                                     count_patient_entries["blood_glucose_level"] +
    //                                     count_patient_entries["weight"] +
    //                                     count_patient_entries["exercise"]
            
    //         let join_date = ''
    //         for (let param of health_record_params) {
    //             let Model = await get_model(param)       
    //             try {
                    
    //                 date = (
    //                     (await Model.find({patient_id: patientt["_id"]}).lean())
    //                 )[0]["createdAt"]
    //                 if(join_date == '') {
    //                     join_date = date
    //                 }
    //                 if(date < earliest) {
    //                     join_date = date
    //                 }
                    
    //             } catch {
    //                 continue;
    //             }  
    //         }

    //         if(join_date != '') {
    //             // Only make the user if they have recorded data ever.
    //             let time_now = new Date().getTime()
    //             let days_since_start = time_delta(join_date, time_now)/24/60/60/1000
                
    //             let required_data_len = (await Patient.findById(patientt["_id"]))["required_data"].length

    //             var my_engagement_rate = patient_participation / (required_data_len * days_since_start)
                
    //             const new_user = new Engagement({
    //                 patient_id: String(patientt["_id"]),
    //                 join_date: join_date, 
    //                 no_records: patient_participation,
    //                 engagement_rate: my_engagement_rate,
    //             })
    //             new_user.save()
    //         }
            
    //     }
    // }