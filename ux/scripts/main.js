/**
 * Created by masonb on 5/13/2017.
 */
//var baseURL="https://ihhzfv6xle.execute-api.us-west-2.amazonaws.com/dev/"

/********* CONSTANTS ****************/
var LOGLIST_START_HOURS = "loglist.start.hours";
var LOGLIST_PAGE_SIZE = "loglist.page.size";
var EVENT_ID="elog.event.id"
var CURRENT_USERID = "elog.user.id"
var AUTH_TOKEN = "elog.auth.token"
var LIST_DATA="elog.list.data"
var UNIT_ID="elog.station.id"
var TO_SAVE_ID_LIST="elog.tosave.list"
var SAVED_RECORD_PREFIX="elog.record."
var SAVED_GIFT_PREFIX="elog.gifted."  //prefix for count of gifts
var GIFT_ID_LIST="elog.gifted.id"
var PCR_ACTION_VITALS="vitals"
var PCR_ACTION_TX="tx"
/**************** Globals  *****************/
var baseURL="/elog/v2/"
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
        var data = fetchRecordFromLocalStorage(listOfIds[i]);
        addLogEntryRow(data.id, data.ptName, data.arrival, data.cc, data.disp,data.locked,data.replicated,true);
    }


    $.ajax({
        url: baseURL + "logsummary/"+eventId+"?hours="+hours + "&count="+pageSize
    }).then(function (data) {
        for (var i = 0; i < data.length; i++) {
            try {
                if (!doesArrayContains(listOfIds,data[i].id)) {
                    addLogEntryRow(data[i].id, data[i].name, data[i].arrival, data[i].cc, data[i].disp, data[i].locked, data[i].replicated, false);
                }
            } catch (oops) {
                alert(oops);
            }
        }
        turnOffWait();
    });
}
function addLogEntryRow(id, ptname, arrival, cc, disp,locked,replicated,localsaved) {
    var dateOb = new Date(arrival);
    var dstr = mkFormattedDate(dateOb);
    var ccLabel = ccMap[cc];
    var dispLabel = dispMap[disp];
    var markup = "<tr><td><a href='#' onclick='showSpecificLogEntry(\""+id + "\")' >"
    if (localsaved){
        markup += "<img width='16' height='16' src='localonly.png'>"
    }else {
        if (replicated) {
            markup += "<img width='16' height='16' src='sync.png'>"
        } else {
            markup += "<img width='16' height='16' src='notsynced.png'>"
        }
    }
    if (locked){
        markup+="<img width='16' height='16' src='lock-icon.png'>"
    }
    markup += "<span class='datetime'>" + dstr + " - </span><span class='cc'>" + ccLabel + "</span><br>"
    markup += "<span class='ptname'> " + ptname + " - " + dispLabel + "</span></td><tr>";
    var $loglist = $("#loglist > tbody");
    $loglist.append(markup);
}

function fillCCSelect() {
    var cc = $("#cc")
    for (var key in ccMap) {
        var value = ccMap[key];
        cc.append($('<option>', {value:key, text:value}));
    }
}

function fillDispoSelect() {
    var disp = $("#disp");
    for (var key in dispMap) {
        var value = dispMap[key];
        disp.append($('<option>', {value:key, text:value}));
    }
}
function  fillCareLevelSelect() {
    var cl=$("#carelevel");
    for (var key in careLevelMap){
        var value=careLevelMap[key];
        cl.append($('<option>', {value:key, text:value}));
    }
}
function fillTxSelect() {
    var disp = $("#tx")
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
function loadRecordInfoUI(data) {


    $("#id").val(data.id);
    var d = new Date(data.arrival);
    setArrivalFields(d)
    d = new Date(data.released);
    setReleasedField(d);
    $("#ptname").val(data.ptName);
    $("#ptcamp").val(data.ptCamp);
    if (data.ptAge > 0) {
        $("#ptage").val(data.ptAge);
        $("#ageAsMonths").prop("checked", false);
    } else {
        var months = data.ptAge * -1
        $("#ageAsMonths").prop("checked", true);
        $("#ptage").val(months);
    }
    $("#ptsex").val(data.ptGender)
    $("#cc").val(data.cc)
    $("#tracking").val(data.tracking)
    $("#disp").val(data.disp)
    $("#tx").val(data.tx)
    $("#unit").val(data.unit)
    $("#provider").val(data.provider)
    $("#notes").val(data.notes)
    $("#location").val(data.location)
    $("#carelevel").val(data.carelevel)

    var eventName = eventMap[data.event]
    $("#eventname").html(eventName);
}

function fetchRemoteRecord(id) {

    $.ajax({
        url: baseURL +"logentry/" + id
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
            ccMap[data.ccs[i].id] = data.ccs[i].label;
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

    } catch (oops) {
        handleError(oops);
    }
}

function fetchListData(callback) {
    let storedJSON = localStorage.getItem(LIST_DATA);
    if (storedJSON != null){
        var data=JSON.parse(storedJSON)
        processListData(data)
        callback()
    }else {
        var ajax = $.ajax({
            url: baseURL + "choicelists/",
            cache: true,
            beforeSend: addHeaders,
        });
        ajax.then(function (data) {
            processListData(data);
            var jsondata=JSON.stringify(data)
            localStorage.setItem(LIST_DATA,jsondata)
            callback();
        });
    }
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
        eventId="1";
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
    $.ajax({
        type: 'POST',
        url: "/utils/logout",
        contentType: "application/json",
        processData: false,
        dataType: "text"
    }).then(function (newOb) {
        //this cache name is defined in servicework.js
        caches.delete("elogapp-v2");
        turnOffWait()
        window.open("login.html", '_self', false)
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
    console.log(ids);
    console.log(event)
    /*
    for (var i=0;i<ids.length;i++){
        var json = localStorage.getItem(SAVED_RECORD_PREFIX + ids[i]);
        sendLogRecordToServer(json)
    }
    var giftIds=fetchGiftedSupplyIdList();
    for (var i=0;i<giftIds.length;i++){
        var giftId = giftIds[i];

        doIncrementOnRemoteServer(giftId)
    }

     */
}
function sendLogRecordToServer(json) {
    $.ajax({
        type: 'POST',
        url: "/api/logentry",
        contentType: "application/json",
        processData: false,
        data: json,
        dataType: "text"
    }).done(function (newOb) {
        var entry = JSON.parse(newOb)
        var ids = fetchListOfLocalRecordIds();
        var newids=[];
        for (var i=0;i<ids.length;i++){
            if (ids[i] != entry.id){
                newids.push(ids[i])
            }
        }
        var idjson=JSON.stringify(newids)
        localStorage.setItem(TO_SAVE_ID_LIST,idjson)
    });
}
function fetchRecordFromLocalStorage(id) {
    var json = localStorage.getItem(SAVED_RECORD_PREFIX + id);
    var data = JSON.parse(json)
    return data;
}
function fetchListOfLocalRecordIds() {
    var idjson = localStorage.getItem(TO_SAVE_ID_LIST)
    var listOfIds;
    if ((idjson != null) && (idjson.length > 0)) {
        listOfIds = JSON.parse(idjson)
    } else {
        listOfIds = [];
    }
    return listOfIds;
}



function addGiftRow( data) {
    label=data.label;
    var id=data.id;
    var markup = "<tr>" ;
    //markup+= "<td>" + label + "</td>";
    markup +="<td><span id='supplyvalue" +id +"'>"  +data.count + "</span></td>"
    markup += "<td><input type='button' class='incrementbutton' value='" + label + " Increment' onclick='doGiftIncrement(" + id + ")'></td>";
    var $loglist = $("#giftedsupplies");
    $loglist.append(markup);
}

function addPcrActionsRow(actionType) {
    var markup = "<tr>" ;
    var timestamp=new Date()
    var dstr=mkFormattedDateForInputField(timestamp);
    markup +="<td><input type='datetime-local' value='"  +dstr + "'> </input></td>"
    markup +="<td>" + actionType + "</td>"
    markup += "<td  class='pcr-actions-description'><input type='text'></td>";
    markup += "<td><input type='text'></td>";
    markup +="</tr>"
    var $loglist = $("#pcrActions");
    $loglist.append(markup);
}

function fetchGiftItems() {
    var eventId = getCurrentEventId();
    $.ajax({
        url: "/api/supplies/" + eventId
    }).then(function (data) {
        var listOfIds=[]
        for (var i = 0; i < data.length; i++) {

            var localdata=loadLocalGiftRecord(data[i].id);
            if ( localdata == null){
                localdata=new Object();
                localdata.count=data[i].count;
                localdata.pending=0;
                localdata.remoteInProgress=false;
                localdata.label=data[i].label;
                localdata.id=data[i].id;
                console.log("Making new Record")
            }else{
                console.log("Using found local data " + localdata.count  + " / " + localdata.pending)
            }

            //take the serveer count as a give but add on any pending local.
            localdata.count=data[i].count + localdata.pending;
            localdata.remoteInProgress = false; //when we reload here, set any in progress to false
            saveLocalGiftedRecord(localdata)

            listOfIds.push(localdata.id)
        }
        saveGiftedSupplyIdList(listOfIds)

    }).always(function (data){
        buildGiftTable();
    });
}
function buildGiftTable(){
    $("#giftedsupplies").empty()
    var giftIds=fetchGiftedSupplyIdList();
    for (var i=0;i<giftIds.length;i++) {
        var giftId = giftIds[i];
        var data=loadLocalGiftRecord(giftId);
        addGiftRow(data);
    }
}
function doGiftIncrement(supplyId){
    var json=localStorage.getItem(SAVED_GIFT_PREFIX + supplyId)
    var localdata=null;
    if ( (json != null)  && (json.length>0 )) {
        localdata = JSON.parse(json)
    }else{
        localdata=new Object();
        localdata.count=0;
        localdata.pending=0;
        localdata.id=supplyId;
    }
    localdata.pending=localdata.pending+1
    console.log("Did increment " + supplyId + " / " + localdata.pending);
    localdata.count=localdata.count+1;
    saveLocalGiftedRecord(localdata)
    var idsel = "#supplyvalue"+localdata.id;
    var valuespan = $(idsel);
    valuespan.html(localdata.count)

}

function saveLocalGiftedRecord(data) {
    var json = JSON.stringify(data);
    localStorage.setItem(SAVED_GIFT_PREFIX + data.id, json)
    return ;
}
function loadLocalGiftRecord(id) {
    var eventId = getCurrentEventId();
    var json = localStorage.getItem(SAVED_GIFT_PREFIX + id);
    var data =null;
    if ( (json != null ) && (json.length>0) ){
        data = JSON.parse(json)
    }
    return data;
}

function doIncrementOnRemoteServer(id) {
    console.log("Increment on server  " + id)
    var localdata =loadLocalGiftRecord(id);
    if ( localdata != null) {
        var incrementAmt=localdata.pending;
        if ( (incrementAmt > 0)  && !localdata.remoteInProgress) {
            //stops the record from being resent while async op occures
            localdata.remoteInProgress=true;
            saveLocalGiftedRecord(localdata)
            $.ajax({
                type: 'POST',
                url: "/api/supplies/increment/" + eventId + "/" + id + "?count=" + incrementAmt
            }).then(function (payload) {
                //refetch it to be safe
                var data = loadLocalGiftRecord(id)
                data.pending = data.pending - incrementAmt;
                //safty check
                if (data.pending < 0) {
                    data.pending = 0;
                }
                data.count = payload.count + data.pending
                saveLocalGiftedRecord(data)

            }).always(function (data){
                var data = loadLocalGiftRecord(id)
                data.remoteInProgress=false;
                saveLocalGiftedRecord(data);
            });
        }
    }
}
function fetchGiftedSupplyIdList() {
    var idjson = localStorage.getItem(GIFT_ID_LIST)
    var listOfIds;
    if ((idjson != null) && (idjson.length > 0)) {
        listOfIds = JSON.parse(idjson)
    } else {
        listOfIds = [];
    }
    return listOfIds;
}
function saveGiftedSupplyIdList(list){
    var json=JSON.stringify(list);
    localStorage.setItem(GIFT_ID_LIST,json)
}

function clearLocalGiftedSupplies() {
    var giftIds = fetchGiftedSupplyIdList()
    for (var i = 0; i < giftIds.length; i++) {
        var giftId = giftIds[i];
        localStorage.removeItem(SAVED_GIFT_PREFIX + id);
    }
    localStorage.removeItem(GIFT_ID_LIST)
}