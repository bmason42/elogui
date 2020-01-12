function backgroundSaveTask() {
    postMessage("")
    setTimeout("backgroundSaveTask()",10000);
}
backgroundSaveTask()