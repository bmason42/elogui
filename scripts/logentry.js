function setArrivalFields(d) {
    var tmp = mkFormattedDateForInputField(d);
    $('#arrival').val(tmp);
}

function setReleasedField(d) {
    var tmp = mkFormattedDateForInputField(d);
    $('#released').val(tmp);
}



function clearForm() {
    $("#savestatus").text("Not saved");
    $("#logID").val("")
    $("#patientID").val("")
    var d = new Date();
    setArrivalFields(d);
    setReleasedField(d);
    $("#tracking").val("")
    $("#ptFirstName").val("");
    $("#ptLastName").val("");
    $("#ptcamp").val("");
    $("#ptage").val("");
    $("#ptsex").val("")
    $("#cc").val(0)
    $("#disp").val(0)
    $("#tx").val(0)
    $("#location").val("")
    //save this $("#unit").val(data.unit)
    $("#provider").val("")
    $("#notes").val("")
}


function mkCopy() {
    $("#logID").val("")
}

function saveLogEntryData(done) {
    turnOnwait();
    $("#savestatus").text("Not saved");
    var data = new Object();
    data.patientInfo=new Object();
    data.logEntry=new Object();

    data.logEntry.logID = $("#logID").val();
    if (data.logEntry.logID.length == 0) {
        data.logEntry.logID = create_UUID();
    }
    data.patientInfo.ptID = $("#patientID").val();
    if (data.patientInfo.ptID.length == 0) {
        data.patientInfo.ptID = create_UUID();
        data.logEntry.ptID=data.patientInfo.ptID
    }

    var tzOffset = makeTZOffset();
    data.localonly = true;
    data.logEntry.arrival = $("#arrival").val() + ":00" + tzOffset;
    data.logEntry.released = $("#released").val() + ":00" + tzOffset;
    data.patientInfo.ptFirstName = $("#ptFirstName").val();
    data.patientInfo.ptLastName = $("#ptLastName").val();
    var inMonths = $('#ageAsMonths').is(':checked')
    var rawAge = $("#ptage").val();
    //we save age in months as a negative value
    //yea yea, I know.  But I missed pt under 1 and had to add it in
    //after production
    if (inMonths == true) {
        rawAge = rawAge * -1;
    } else {
        rawAge = rawAge * 1;//make a number
    }
    data.patientInfo.ptAge = rawAge;
    data.patientInfo.ptCamp = $("#ptcamp").val();
    data.patientInfo.ptGender = $("#ptsex").val();
    data.logEntry.disp = parseInt($("#disp").val(),10);
    data.logEntry.cc = parseInt($("#cc").val(),10);

    data.logEntry.trackingID = $("#tracking").val();
    if (data.logEntry.trackingID.length==0){
        data.logEntry.trackingID=create_UUID()
    }
    data.logEntry.provider = $("#provider").val();
    data.logEntry.notes = $("#notes").val();
    data.logEntry.unit = $("#unit").val();
    data.logEntry.tx = parseInt($("#tx").val(),10)
    data.logEntry.location = $("#location").val();
    data.logEntry.careLevel = parseInt($("#carelevel").val(),10);
    data.logEntry.eventID = parseInt(localStorage.getItem(EVENT_ID),10);
    data.logEntry.locked = false;  // change to = done when locking is working right
    let json = JSON.stringify(data);
    let idList = fetchListOfLocalRecordIds()
    //keep these two
    localStorage.setItem(SAVED_RECORD_PREFIX + data.logEntry.logID, json)
    if (!doesArrayContains(idList, data.logEntry.logID)) {
        idList.push(data.logEntry.logID)
    }

    var idjson = JSON.stringify(idList)
    localStorage.setItem(TO_SAVE_ID_LIST, idjson)

    $("#logID").val(data.logEntry.logID);
    $("#patientID").val(data.patientInfo.ptID);
    $("#tracking").val(data.logEntry.trackingID)
    let  tmp = mkFormattedDate(new Date());
    $("#savestatus").text("Saved " + tmp)
    if (done) {
        clearForm();
    }
    turnOffWait()
    return data;
}
function loadRecordInfoUI(data) {
    $("#logID").val(data.logEntry.logID);
    $("#patientID").val(data.patientInfo.ptID);
    var d = new Date(data.logEntry.arrival);
    setArrivalFields(d)
    d = new Date(data.logEntry.released);
    setReleasedField(d);

    $("#ptFirstName").val(data.patientInfo.ptFirstName);
    $("#ptLastName").val(data.patientInfo.ptLastName);

    $("#ptcamp").val(data.patientInfo.ptCamp);
    if (data.patientInfo.ptAge > 0) {
        $("#ptage").val(data.patientInfo.ptAge);
        $("#ageAsMonths").prop("checked", false);
    } else {
        var months = data.patientInfo.ptAge * -1
        $("#ageAsMonths").prop("checked", true);
        $("#ptage").val(months);
    }
    $("#ptsex").val(data.patientInfo.ptGender)
    $("#cc").val(data.logEntry.cc)
    $("#tracking").val(data.logEntry.trackingID)
    $("#disp").val(data.logEntry.disp)
    $("#tx").val(data.logEntry.tx)
    $("#unit").val(data.logEntry.unit)
    $("#provider").val(data.logEntry.provider)
    $("#notes").val(data.logEntry.notes)
    $("#location").val(data.logEntry.location)
    $("#carelevel").val(data.logEntry.careLevel)

    var eventName = eventMap[data.logEntry.eventId]
    $("#eventname").html(eventName);
}