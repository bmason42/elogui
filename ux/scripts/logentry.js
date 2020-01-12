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
    $("#id").val("")
    var d = new Date();
    setArrivalFields(d);
    setReleasedField(d);
    $("#ptname").val("");
    $("#ptcamp").val("");
    $("#ptage").val("");
    $("#ptsex").val("")
    $("#cc").val(0)
    $("#tracking").val("")
    $("#disp").val(0)
    $("#tx").val(0)
    $("#location").val("")
    //save this $("#unit").val(data.unit)
    $("#provider").val("")
    $("#notes").val("")
}


function mkCopy() {
    $("#id").val("")
}


function saveLogEntryData(done) {
    turnOnwait();
    $("#savestatus").text("Not saved");
    var data = new Object();
    data.id = $("#id").val();
    if (data.id.length == 0) {
        data.id = create_UUID()
    }
    var tzOffset = makeTZOffset();
    data.localonly = true;
    data.arrival = $("#arrival").val() + ":00" + tzOffset;
    data.released = $("#released").val() + ":00" + tzOffset;
    data.ptName = $("#ptname").val();
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
    data.ptAge = rawAge;
    data.ptCamp = $("#ptcamp").val();
    data.ptGender = $("#ptsex").val();
    data.disp = $("#disp").val();
    data.cc = $("#cc").val();
    data.tracking = $("#tracking").val();
    data.provider = $("#provider").val();
    data.notes = $("#notes").val();
    data.unit = $("#unit").val();
    data.tx = $("#tx").val();
    data.location = $("#location").val();
    data.carelevel = $("#carelevel").val();
    data.event = localStorage.getItem(EVENT_ID)
    data.locked = false;  // change to = done when locking is working right
    var json = JSON.stringify(data);
    var idList = fetchListOfLocalRecordIds()
    var tmpname=data.ptName
    //keep these two
    localStorage.setItem(SAVED_RECORD_PREFIX + data.id, json)
    if (!doesArrayContains(idList, data.id)) {
        idList.push(data.id)
    }

    var idjson = JSON.stringify(idList)
    localStorage.setItem(TO_SAVE_ID_LIST, idjson)

    $("#id").val(data.id);
    var tmp = mkFormattedDate(new Date());
    $("#savestatus").text("Saved " + tmp)
    if (done) {
        clearForm();
    }
    turnOffWait()
}