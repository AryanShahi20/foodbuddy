/* Ref to help Melana:
function commentPopup() {
    document.getElementById('commentPopup').style.display='block';
}

To call it: onclick="commentPopup()"
*/


// Add data pages
function commentPopup() {
    document.getElementById('commentPopup').style.display='block';
}

function commentPopupHide() {
    document.getElementById('commentPopup').style.display='none';
}


// Clinician clinician_patient page
function changeThresholds() {
    document.getElementById('changeThresholds').style.display='block';
    document.getElementById('staticThresholds').style.display='none';
}

function staticThresholds() {
    document.getElementById('changeThresholds').style.display='none';
    document.getElementById('staticThresholds').style.display='block';
}


// Patient profile page
function revealButtons() {
    document.getElementById('submitButtons').style.display='flex';
}

function contactPhysician1() {
    document.getElementById('contactPhysician1').style.display='block';
}

function contactPhysician2() {
    document.getElementById('contactPhysician2').style.display='block';
}

function editEmail() {
    document.getElementById('editEmail').style.display='block';
    document.getElementById('staticEmail').style.display='none';
}

function editUsername() {
    document.getElementById('editUsername').style.display='block';
    document.getElementById('staticUsername').style.display='none';
}

function editBirth() {
    document.getElementById('editBirth').style.display='block';
    document.getElementById('staticBirth').style.display='none';
}

function editBio() {
    document.getElementById('editBio').style.display='block';
    document.getElementById('staticBio').style.display='none';
}


// Engagement badge popup
function engagementPopup() {
    document.getElementById('engagement_popup').style.display='block';
}

function engagementPopupGone() {
    document.getElementById('engagement_popup').style.display='none';
}