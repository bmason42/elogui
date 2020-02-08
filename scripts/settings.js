function fillEventList() {
    var el=$("#eventlist")
    for (var key in eventMap){
        var value=eventMap[key];
        el.append($('<option>', {value:key, text:value}));
    }
}

function onEventChange(item) {
    var eventId=item.value;  //$("#eventlist").val()
    localStorage.setItem(EVENT_ID,eventId);
    var unitList=unitMap[eventId];
    var unitSel = $("#unit");
    unitSel.empty()
    var currentUnit=getCurrentUnit()
    var unitToSelect=""
    for (var unit in unitList) {
        var value=unitList[unit]
        unitSel.append($('<option>', {value:value, text:value}));
        if (currentUnit == value){
            unitToSelect=currentUnit
        }
    }
    if (unitToSelect.length <0) {
        unitToSelect = unitList[0];
    }
    unitSel.val(unitToSelect)
    localStorage.setItem(UNIT_ID,unitToSelect)
    $("#eventName").text(eventMap[eventId])
    clearLocalGiftedSupplies()
    //fetchGiftItems()

}
function onStationChange(item) {
    var stationId=item.value;
    localStorage.setItem(UNIT_ID,stationId)
}