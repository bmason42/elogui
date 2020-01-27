function initMenu(){
    $("#settingsmenu").click(function() {
        switchCards("#settings")
    });

    $("#logmenu").click(function() {
        switchCards("#log")
    });
    $("#entrymenu").click(function() {
        switchCards("#entry")
        //chooseEventAndStationOnLogEntryPage()
        clearForm()
    });
    $("#giftsmenu").click(function() {
        switchCards("#gift")
    });
    $("#pcrmenu").click(function () {
        switchCards("#pcr")
    })

    $("#logoutmenu").click(function() {
        dologout()
    });
}