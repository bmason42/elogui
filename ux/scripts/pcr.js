function addPcrActionsRow() {
    var markup = "<tr>";
    var timestamp = new Date()
    var dstr = mkFormattedDateForInputField(timestamp);
    markup += "<td><input type='datetime-local' value='" + dstr + "'> </input></td>"
    markup += "<td  class='pcr-actions-description'><input type='text'></td>";
    markup += "<td><input type='text'></td>";
    markup += "</tr>"
    var $loglist = $("#pcrActions");
    $loglist.append(markup);
}

function launchPCR() {
    let data = saveLogEntryData(false)
    $("#pcr_tracking").val(data.logEntry.trackingID);
    $("#pcr_name").val(data.patientInfo.ptFirstName + " " +data.patientInfo.ptLastName );
    $("#pcr_age").val(data.patientInfo.ptAge);
    $("#pcr_gender").val(data.patientInfo.ptGender);
    $("#pcrPtID").val(data.logEntry.ptID);

    switchCards("#pcr")
    fetchPcrRecord(data.trackingID)
}

function savePCR() {
    turnOnwait();
    let tzOffset = makeTZOffset();
    let pcr = new Object()
    pcr.trackingID = $("#pcr_tracking").val();
    pcr.ptID = $("#pcrPtID").val();
    pcr.incidentLocation = $("#pcr_incident_location").val();
    pcr.incidentTime = $("#pcr_incdent_time").val() + ":00" + tzOffset;
    pcr.incidentDescription = $("#pcr_incedent_desc").val();
    pcr.history = $("#pcr_history").val();
    pcr.allergies = $("#pcr_allergies").val();
    pcr.medications = $("#pcr_medications").val();
    pcr.comments = $("#pcrnotes").val();
    pcr.refusal = $('#refuse').is(":checked");
    pcr.ptRefusalSignature = $("#refusalSig").val();
    pcr.witnessName = $("#refusalWitness").val();
    //pcr.interventions


    let json = JSON.stringify(pcr);
    let idList = fetchListOfLocalPcrIds()
    //keep these two
    localStorage.setItem(SAVED_PCR_PREFIX + pcr.trackingID, json)
    if (!doesArrayContains(idList, pcr.trackingID)) {
        idList.push(pcr.trackingID)
    }

    var idjson = JSON.stringify(idList)
    localStorage.setItem(TO_SAVE_PCR_ID_LIST, idjson)
    turnOffWait()
}

function loadPcrIntoUI(pcr,localonly) {
    if (pcr == null){
        return
    }
    var imgSrc="imaages/localonly.png";
    if (!localonly){
        if (pcr.replicated){
            imgSrc="imaages/sync.png";
        }else {
            imgSrc = "imaages/notsynced.png";
        }
    }
    $("#pcrReplicated").attr("src",imgSrc);
    $("#pcr_tracking").val(pcr.trackingID);
    $("#pcrPtID").val(pcr.ptID);
    $("#pcr_incident_location").val(pcr.incidentLocation);
    let d = new Date(pcr.incidentTime);
    let tmp = mkFormattedDateForInputField(d);
    $("#pcr_incdent_time").val(tmp)
    $("#pcr_incedent_desc").val(pcr.incidentDescription);
    $("#pcr_history").val(pcr.history);
    $("#pcr_allergies").val(pcr.allergies);
    $("#pcr_medications").val(pcr.medications);
    $("#pcrnotes").val(pcr.comments);
    $('#refuse').val(pcr.refusal)
    $("#refusalSig").val(pcr.ptRefusalSignature);
    $("#refusalWitness").val(pcr.witnessName);

}
function fetchPcrFromLocalStorage(trackingID) {
    var json = localStorage.getItem(SAVED_PCR_PREFIX + id);
    var data = JSON.parse(json)
    return data;
}
function fetchPcrRecord(trackingID){
    var idList=fetchListOfLocalPcrIds()

    if (doesArrayContains(idList,trackingID)) {
        let data=fetchPcrFromLocalStorage(trackingID)
        loadPcrIntoUI(data,true)
    }else{
        fetchRemotePcrRecord(trackingID)
    }
}
function fetchRemotePcrRecord(trackingID) {

    $.ajax({
        url: baseURL +"pcr/" + trackingID,
        beforeSend: addHeaders,
    }).then(function (data) {
        loadPcrIntoUI(data,false);
    })
}