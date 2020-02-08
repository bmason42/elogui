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
    $("#pcrActions").empty();
    addInterventionHeader();
    let data = saveLogEntryData(false)
    $("#pcr_tracking").val(data.logEntry.trackingID);
    $("#pcr_name").val(data.patientInfo.ptFirstName + " " +data.patientInfo.ptLastName );
    $("#pcr_age").val(data.patientInfo.ptAge);
    $("#pcr_gender").val(data.patientInfo.ptGender);
    $("#pcrPtID").val(data.logEntry.ptID);
    //seed incicdent time with arrival
    let d = new Date(data.logEntry.arrival);
    let tmp = mkFormattedDateForInputField(d);
    $("#pcr_incdent_time").val(tmp)
    switchCards("#pcr")
    fetchPcrRecord(data.logEntry.trackingID)
}

function savePCR() {
    turnOnwait();
    let tzOffset = makeTZOffset();
    let pcr = new Object()
    pcr.trackingID = $("#pcr_tracking").val();
    pcr.ptID = $("#pcrPtID").val();
    pcr.incidentLocation = $("#pcr_incident_location").val();
    pcr.incidentTime = $("#pcr_incdent_time").val() + ":00" + tzOffset;
    pcr.incidentDescription = $("#pcr_incident_desc").val();
    pcr.history = $("#pcr_history").val();
    pcr.allergies = $("#pcr_allergies").val();
    pcr.medications = $("#pcr_medications").val();
    pcr.comments = $("#pcrnotes").val();
    pcr.refusal = $('#refuse').is(":checked");
    pcr.ptRefusalSignature = $("#refusalSig").val();
    pcr.witnessName = $("#refusalWitness").val();

    pcr.interventions=fetchActionsFromUI()



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
    var imgSrc="images/localonly.png";
    if (!localonly){
        if (pcr.replicated){
            imgSrc="images/sync.png";
        }else {
            imgSrc = "images/notsynced.png";
        }
    }
    $("#pcrReplicated").attr("src",imgSrc);
    $("#pcr_tracking").val(pcr.trackingID);
    $("#pcrPtID").val(pcr.ptID);
    let d = new Date(pcr.incidentTime);
    let tmp = mkFormattedDateForInputField(d);
    $("#pcr_incdent_time").val(tmp)
    $("#pcr_incident_location").val(pcr.incidentLocation);
    $("#pcr_incident_desc").val(pcr.incidentDescription);

    $("#pcr_history").val(pcr.history);
    $("#pcr_allergies").val(pcr.allergies);
    $("#pcr_medications").val(pcr.medications);
    $("#pcrnotes").val(pcr.comments);
    $('#refuse').prop("checked", pcr.refusal);
    $("#refusalSig").val(pcr.ptRefusalSignature);
    $("#refusalWitness").val(pcr.witnessName);

    if (typeof pcr.interventions == 'undefined'){
        pcr.interventions=[];
    }
    for (var i=0;i<pcr.interventions.length;i++){
        var data=pcr.interventions[i];
        addPcrActionsRow(data)
    }

}


function fetchPcrFromLocalStorage(trackingID) {
    var json = localStorage.getItem(SAVED_PCR_PREFIX + trackingID);
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
function addInterventionHeader() {
    let headerRow="<tr><th>Time</th> <th>Description</th> <th>Provider</th> </tr>"
    var actionList = $("#pcrActions");
    actionList.append(headerRow);

}
function fetchActionsFromUI() {
    var ret=[]
    var rowCount = $('#pcrActions tr').length;
    let tzOffset = makeTZOffset();
    for (var i=1;i<rowCount;i++){
        var action=new Object()
        action.timestamp= $("#action_ts_"+i).val() + ":00" + tzOffset;
        action.description=$("#action_desc_"+i).val();
        action.provider=$("#action_provider_"+i).val();
        ret[i-1]=action;
    }
    return ret;
}
function addPcrActionsRow(data) {
    var markup = "<tr>" ;

    var rowCount = $('#pcrActions tr').length;
    console.log("Table row count: " + rowCount)
    var timestamp=new Date()
    var description ;
    var provider;
    if (data == null){
        timestamp=new Date()
        description="";
        provider="";
    }else {
        timestamp = new Date(data.timestamp);
        description=data.description;
        provider=data.provider;
    }
    var dstr=mkFormattedDateForInputField(timestamp);
    markup +="<td><input type='datetime-local' id='action_ts_" +rowCount + "' value='"  +dstr + "'> </td>"
    markup += "<td  class='pcr-actions-description'><input type='text' id='action_desc_" +rowCount + "' value='"+description +" '></td>";
    markup += "<td><input type='text' id='action_provider_" +rowCount + "' value='"+ provider + " '></td>";
    markup +="</tr>"
    var actionList = $("#pcrActions");
    actionList.append(markup);




}