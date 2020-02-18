/**
 * Created by masonb on 5/13/2017.
 */
//var baseURL="https://ihhzfv6xle.execute-api.us-west-2.amazonaws.com/dev/"

/********* CONSTANTS ****************/
const LOGLIST_START_HOURS = "loglist.start.hours";
const LOGLIST_PAGE_SIZE = "loglist.page.size";
const EVENT_ID="elog.event.id"
const CURRENT_USERID = "elog.user.id"
const AUTH_TOKEN = "elog.auth.token"
const LIST_DATA="elog.list.data"
const UNIT_ID="elog.station.id"
const TO_SAVE_ID_LIST="elog.tosave.list"
const TO_SAVE_PCR_ID_LIST="elog.pcrtosave.list"
const SAVED_RECORD_PREFIX="elog.record."
const SAVED_PCR_PREFIX="elog.pcr."
const SAVED_GIFT_PREFIX="elog.gifted."  //prefix for count of gifts
const GIFT_ID_LIST="elog.gifted.id"
const GIFT_UI_ID_PREFIX="giftedId_"
/**************** Globals  *****************/
const baseURL="/elog/v2/"
var ccMap=[];
var eventMap=[];
var unitMap=[];
var dispMap=[];
var txMap=[];
var careLevelMap=[];

function turnOnwait(){
    $('body').addClass('waiting');
}
function turnOffWait(){
    $('body').removeClass('waiting');
}


function getQueryStrings() {
    var assoc  = {};
    var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');

    for(var i in keyValues) {
        var key = keyValues[i].split('=');
        if (key.length > 1) {
            assoc[decode(key[0])] = decode(key[1]);
        }
    }

    return assoc;
}
function errorHandler(event, jqxhr, settings, thrownError) {
    var msg;
    turnOffWait();
    if (jqxhr.status==401){
        window.open("login.html",'_self',false)
    }else {
        if ("LOCKED" == thrownError) {
            msg = "The record has been locked.  Please contact your station sup or lead to unlock the record"
        } else {
            msg = thrownError.toString()
        }

        console.log(msg)
    }


}



function fetchRecords() {

    turnOnwait()
    $("#summaryTB").empty();
    var d = new Date();
    var $startTimeInput = $("#startTimeInput");
    var $pageSizeInput = $("#pageSizeInput");
    var hours=Number($startTimeInput.val());
    var pageSize=Number($pageSizeInput.val());
    localStorage.setItem(LOGLIST_START_HOURS,hours);
    localStorage.setItem(LOGLIST_PAGE_SIZE,pageSize)
    var eventId=getCurrentEventId();
    var listOfIds = fetchListOfLocalRecordIds();
    for (var i=0;i<listOfIds.length;i++){
        let data = fetchRecordFromLocalStorage(listOfIds[i]);
        var summaryRecord=new Object()
        summaryRecord.arrival=data.logEntry.arrival;
        summaryRecord.replicated=data.logEntry.replicated;
        summaryRecord.cc=data.logEntry.cc;
        summaryRecord.disp=data.logEntry.disp;
        summaryRecord.logID=data.logEntry.logID;
        summaryRecord.locked=data.logEntry.locked;
        summaryRecord.ptFirstName=data.patientInfo.ptFirstName;

        addLogEntryRow(summaryRecord,true);
    }

    let unitId=localStorage.getItem(UNIT_ID);
    $.ajax({
        url: baseURL + "summary/"+eventId+"/"+unitId +"?hours="+hours + "&count="+pageSize,
        beforeSend: addHeaders
    }).then(function (data) {
        for (var i = 0; i < data.length; i++) {
            try {
                if (!doesArrayContains(listOfIds,data[i].logID)) {
                    addLogEntryRow(data[i], false);
                }
            } catch (oops) {
                alert(oops);
            }
        }
        turnOffWait();
    });
}
function addLogEntryRow(summaryRecord,localsaved) {
    var dateOb = new Date(summaryRecord.arrival);
    var dstr = mkFormattedDate(dateOb);
    var ccLabel = ccMap[summaryRecord.cc];
    var dispLabel = dispMap[summaryRecord.disp];
    var markup = "<tr><td><a href='#' onclick='showSpecificLogEntry(\""+summaryRecord.logID + "\")' >"
    if (localsaved){
        markup += "<img width='16' height='16' src='images/localonly.png'>"
    }else {
        if (summaryRecord.replicated) {
            markup += "<img width='16' height='16' src='images/sync.png'>"
        } else {
            markup += "<img width='16' height='16' src='images/notsynced.png'>"
        }
    }
    if (summaryRecord.locked){
        markup+="<img width='16' height='16' src='lock-icon.png'>"
    }
    markup += "<span class='datetime'>" + dstr + " - </span><span class='cc'>" + ccLabel + "</span><br>"
    markup += "<span class='ptname'> " + summaryRecord.ptFirstName + " - " + dispLabel + "</span></td><tr>";
    var $loglist = $("#loglist > tbody");
    $loglist.append(markup);
}

function fillCCSelect() {
    var cc = $("#cc")
    var listOfStuff=[]
    for (var key in ccMap) {
        var data=new Object()
        data.key=key
        data.value = ccMap[key];
        listOfStuff[listOfStuff.length]=data
    }
    listOfStuff.sort(function (a,b) {
        return a.value.localeCompare(b.value)
    });
    cc.empty()
    for (var i=0;i<listOfStuff.length;i++)
    {
        var key=listOfStuff[i].key;
        var value=listOfStuff[i].value;
        cc.append($('<option>', {value: key, text: value}));
    }
}

function fillDispoSelect() {
    var disp = $("#disp");
    disp.empty()
    for (var key in dispMap) {
        var value = dispMap[key];
        disp.append($('<option>', {value:key, text:value}));
    }
}
function  fillCareLevelSelect() {
    var cl=$("#carelevel");
    cl.empty()
    for (var key in careLevelMap){
        var value=careLevelMap[key];
        cl.append($('<option>', {value:key, text:value}));
    }
}
function fillTxSelect() {
    var disp = $("#tx")
    disp.empty()
    for (var key in txMap) {
        var value = txMap[key];
        disp.append($('<option>', {value:key, text:value}));
    }
}
function fillUnitSelect() {
    var eventId=localStorage.getItem(EVENT_ID);
    var unitId=localStorage.getItem(UNIT_ID);
    var unitList=unitMap[eventId];
    var unitSel = $("#logentryunit");
    unitSel.empty()
    var unitToSelect=""
    for (var unit in unitList) {
        var value=unitList[unit]
        unitSel.append($('<option>', {value:value, text:value}));
        if (unitId == value){
            unitToSelect=unitId
        }
    }
    if (unitToSelect.length <0) {
        unitToSelect = unitList[0];
    }
    unitSel.val(unitToSelect)

}
function chooseEventAndStationOnLogEntryPage() {
    fillUnitSelect();
    //params = getQueryStrings();
    //var idParam = params["id"];
    eventId = localStorage.getItem(EVENT_ID);
    eventName = eventMap[eventId]
    $("#eventname").html(eventName);
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function fetchRecord(id){
    var idList=fetchListOfLocalRecordIds()

    if (doesArrayContains(idList,id)) {
        var data=fetchRecordFromLocalStorage(id)
        loadRecordInfoUI(data)
    }else{
        fetchRemoteRecord(id)
    }
}
function doesArrayContains(list,item){
    var ret=false;
    for (var i=0;i<list.length;i++){
        if (list[i] == item){
            ret=true;
            break;
        }
    }
    return ret;
}
function clearLogForm() {
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


function fetchRemoteRecord(id) {

    $.ajax({
        url: baseURL +"logs/" + id,
        beforeSend: addHeaders,
    }).then(function (data) {
        loadRecordInfoUI(data);
    });
}
function addHeaders(xhr) {
    var token=localStorage.getItem(AUTH_TOKEN);
    xhr.setRequestHeader('x-auth', token);
}

function processListData(data) {
    try {
        for (var i = 0; i < data.ccs.length; i++) {
            ccMap[data.ccs[i].id] = data.ccs[i].header + " - " + data.ccs[i].label;
        }
        for (var i = 0; i < data.dispos.length; i++) {

            dispMap[data.dispos[i].id] = data.dispos[i].label;
        }
        for (var i = 0; i < data.txs.length; i++) {

            txMap[data.txs[i].id] = data.txs[i].label;
        }
        for (var i = 0; i < data.carelevels.length; i++) {
            careLevelMap[data.carelevels[i].id] = data.carelevels[i].label;
        }
        for (var i = 0; i < data.events.length; i++) {
            eventMap[data.events[i].eventID] = data.events[i].label;
            let unitsString = data.events[i].units;
            let units = unitsString.split("|")
            unitMap[data.events[i].eventID] = units;
        }
        $("#giftedsupplies").empty()
        for (var i=0;i<data.supplies.length;i++) {
            if(!data.supplies[i].hasOwnProperty("count")){
                data.supplies[i].count=0;
            }
            addGiftRow(data.supplies[i])
        }

    } catch (oops) {
        handleError(oops);
    }
}

function fetchListData(callback) {
    //first try to use what we have stored
    let storedJSON = localStorage.getItem(LIST_DATA);
    if (storedJSON != null){
        var data=JSON.parse(storedJSON)
        processListData(data)
        callback()
    }
    var ajax = $.ajax({
        url: baseURL + "choicelists/",
        cache: true,
        beforeSend: addHeaders,
    });
    //try to grab the data, if we are online, yay!, if not, hopefully we have stored lists
    ajax.then(function (data) {
        processListData(data);
        var jsondata=JSON.stringify(data)
        localStorage.setItem(LIST_DATA,jsondata)
        callback();
    });
}

function handleError(error){
    alert(error);
}

function mkFormattedDate(d) {
    var month = d.getMonth()+1;
    var day = d.getDate();
    return padit(d.getHours(),2) + ":" + padit(d.getMinutes(),2) + ":" + padit(d.getSeconds(),2) + " - " + padit(month,2) + "/" + padit(day,2) + "/" + d.getFullYear();
}
function mkFormattedDateForInputField(d) {
    var month = d.getMonth()+1;
    var day = d.getDate();
    var ret=  d.getFullYear() +"-" +padit(month,2) + "-" + padit(day,2) + "T" + padit(d.getHours(),2) + ":" + padit(d.getMinutes(),2);
    return ret;
}
function makeTZOffset() {
    var d = new Date()
    var tzOffsetNumber = d.getTimezoneOffset();
    var offsetDir = "+"
    if (tzOffsetNumber > 0) {
        offsetDir = "-";// yea, its backwards
    }
    tzOffsetNumber = Math.abs(tzOffsetNumber);
    var tzhour = padit(tzOffsetNumber / 60, 2);
    var tzmin = padit(tzOffsetNumber % 60, 2);
    var tzOffset = offsetDir + tzhour + ":" + tzmin;
    return tzOffset;
}
function padit(v,len) {
    var ret="";
    var val=""+v;
    var limit=len-val.length;
    for (i=0;i<limit;i++){
        ret=ret+"0";
    }
    ret=ret+val;
    return ret;
}


function getCurrentEventId(){
    var eventId=localStorage.getItem(EVENT_ID);
    if (eventId == null || eventId.length ==0){
        eventId="0";
    }
    return eventId;
}
function getCurrentUnit() {
    var unit=localStorage.getItem(UNIT_ID)
    if (unit == null  || unit.length ==0){
        unit="unassignd"
    }
    return unit
}

function hideAllContentCards() {
    var cards = $(".content");

    for (i = 0; i < cards.length; i++) {
        $("#" + cards[i].id).hide();

    }
}

function showSpecificLogEntry(logid){
    switchCards("#entry")
    fetchRecord(logid);
}
function switchCards(id){
    hideAllContentCards();
    $(id).show()


}
function dologout() {
    turnOnwait()
    localStorage.removeItem(AUTH_TOKEN)
    localStorage.removeItem(CURRENT_USERID)
    localStorage.removeItem(LIST_DATA)
    //this cache name is defined in servicework.js
    caches.delete("elogapp-v2");



    //fire and forget this
    $.ajax({
        type: 'POST',
        url: "/elog/v2/logout",
        contentType: "application/json",
        processData: false,
        dataType: "text"
    }).done(function (newOb) {
        console.log("Logged out")
        turnOffWait()
        window.open("/login.html", '_self', false)
    });



}

/****************** B A C K  G R O U N D   S T U F F **************************************/
function registerBackgroundWorkers(){
    registerRecordSaveHandler()
    registerServiceWorker()
}
function registerServiceWorker(){

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.log('SW Registration Error: ', err));
    }else{
        console.log("No Service Worker, no off line mode")
    }
}
/*
Registers the Web Worker callback handler
 */
function registerRecordSaveHandler() {
    if (typeof (w) == "undefined") {
        w = new Worker("/scripts/ww.js");
        w.onmessage = handleSaveCallback;
    }
}
/*
Called from the web worker to save data to the server
 */
function handleSaveCallback(event){
    console.log("Save Callback")
    var ids = fetchListOfLocalRecordIds();
    //console.log(ids);
    console.log(event)

    for (var i=0;i<ids.length;i++){
        let logrecordID = ids[i];
        var json = localStorage.getItem(SAVED_RECORD_PREFIX + logrecordID);
        let logRecord=JSON.parse(json);
        //filter out records with no names.
        if (logRecord.patientInfo.ptFirstName.length >0){
            sendLogRecordToServer(json)
        }
    }

    var pcrIds=fetchListOfLocalPcrIds()
    for (var i=0;i<pcrIds.length;i++){
        var json = localStorage.getItem(SAVED_PCR_PREFIX + pcrIds[i]);
        sendPcrRecordToServer(json)
    }

    incrementSuppliesOnServer();

}
function incrementSuppliesOnServer() {
    let eventID=getCurrentEventId();
    var json=localStorage.getItem(SAVED_GIFT_PREFIX + eventId);
    if ( (json == null)  || (json.length==0 )) {
        return;
    }
    var listToUpdate=[];
    var i=0;
    let localdata = JSON.parse(json)
    for (let prop in localdata) {
        if (localdata.hasOwnProperty(prop)) {
            let counts=localdata[prop]
            if (counts.pending>0){
                //the api does not know pending, it needs the count in the count field, little backwards
                counts.count=counts.pending;
                listToUpdate[i++]=counts
            }
        }
    }
    if (listToUpdate.length == 0){
        return;
    }
    let dataToSend=JSON.stringify(listToUpdate)
    $.ajax({
        type: 'POST',
        url: baseURL + "supply-counts/"+eventID,
        beforeSend: addHeaders,
        contentType: "application/json",
        processData: false,
        data: dataToSend,
        dataType: "text"
    }).done(function (newOb) {
        var updatedEntries = JSON.parse(newOb)
        var storedJson=localStorage.getItem(SAVED_GIFT_PREFIX + eventId);
        let currentData=JSON.parse(storedJson)
        for (var i=0;i<updatedEntries.length;i++){
            let prop=""+updatedEntries[i].supplyID
            currentData[prop].pending-=localdata[prop].pending
            currentData[prop].count=updatedEntries[i].count
        }
        storedJson=JSON.stringify(currentData)
        localStorage.setItem(SAVED_GIFT_PREFIX + eventId,storedJson)
    });

}
function sendLogRecordToServer(json) {
    $.ajax({
        type: 'POST',
        url: baseURL + "logs",
        beforeSend: addHeaders,
        contentType: "application/json",
        processData: false,
        data: json,
        dataType: "text"
    }).done(function (newOb) {
        var entry = JSON.parse(newOb)
        var ids = fetchListOfLocalRecordIds();
        var newids=[];
        for (var i=0;i<ids.length;i++){
            if (ids[i] != entry.logEntry.logID){
                newids.push(ids[i])
            }
        }
        var idjson=JSON.stringify(newids)
        localStorage.setItem(TO_SAVE_ID_LIST,idjson)
    });
}
function sendPcrRecordToServer(json){
    $.ajax({
        type: 'POST',
        url: baseURL + "pcr",
        beforeSend: addHeaders,
        contentType: "application/json",
        processData: false,
        data: json,
        dataType: "text"
    }).done(function (newOb) {
        var entry = JSON.parse(newOb)
        var ids = fetchListOfLocalPcrIds();
        var newids=[];
        for (var i=0;i<ids.length;i++){
            if (ids[i] != entry.trackingID){
                newids.push(ids[i])
            }
        }
        var idjson=JSON.stringify(newids)
        localStorage.setItem(TO_SAVE_PCR_ID_LIST,idjson)
    });
}
function fetchRecordFromLocalStorage(id) {
    var json = localStorage.getItem(SAVED_RECORD_PREFIX + id);
    var data = JSON.parse(json)
    return data;
}
function loadListOfRecords(listID){
    var idjson = localStorage.getItem(listID)
    var listOfIds;
    if ((idjson != null) && (idjson.length > 0)) {
        listOfIds = JSON.parse(idjson)
    } else {
        listOfIds = [];
    }
    return listOfIds;
}
function fetchListOfLocalRecordIds() {
    return loadListOfRecords(TO_SAVE_ID_LIST)
}
function fetchListOfLocalPcrIds() {
    return loadListOfRecords(TO_SAVE_PCR_ID_LIST)
}



function addGiftRow( data) {
    label=data.label;
    var id=data.supplyID;
    var markup = "<tr>" ;
    var count=0;
    //markup+= "<td>" + label + "</td>";
    markup +="<td> <span>";
    markup +="<input type='button' class='incrementbutton' value='" + label +"' onclick='doGiftIncrement(" + id + ")'>"
    markup+="<span id='"+ GIFT_UI_ID_PREFIX +id + "'>" +data.count + "</span>"
    markup+="</span> </td>"
    var $loglist = $("#giftedsupplies");
    $loglist.append(markup);
}

function doGiftIncrement(supplyId){
    let propName=supplyId
    let eventId=getCurrentEventId()
    var json=localStorage.getItem(SAVED_GIFT_PREFIX + eventId)
    var localdata=null;
    if ( (json != null)  && (json.length>0 )) {
        localdata = JSON.parse(json)
    }else{
        localdata=new Object();
    }

    var propData
    if (localdata.hasOwnProperty(propName)) {
        propData=localdata[propName]
    }else{
        propData=new Object()
        propData.pending=0;
        propData.supplyID=parseInt(supplyId);
        propData.eventID=parseInt(eventId);
        propData.count=0
        localdata[propName]=propData
    }
    propData.pending=propData.pending+1;
    propData.count=propData.count+1;

    json=JSON.stringify(localdata);
    localStorage.setItem(SAVED_GIFT_PREFIX + eventId,json);

    var idsel = "#"+GIFT_UI_ID_PREFIX+propData.supplyID;
    var valuespan = $(idsel);
    valuespan.html(propData.count)


}

