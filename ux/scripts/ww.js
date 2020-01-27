function backgroundSaveTask() {
    postMessage("save")
    setTimeout("backgroundSaveTask()",10000);
}
backgroundSaveTask()