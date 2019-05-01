const {ipcRenderer} = require('electron');
var app = require('electron').remote;
var dialog = app.dialog;
var fs = require('fs');
const Config = require('electron-config');
const config = new Config();

function openprj() {
    dialog.showOpenDialog({
        filters: [

            {name: 'DSAUtilites Projektfile', extensions: ['dsa']}

        ]
    }, function (fileNames) {
        try {
            if (fileNames === undefined) return;
            config.set("lastOpendPrj", fileNames[0]);
            var data = fs.readFile(fileNames[0], (err, data) => {
                if (err) throw err;
                var obj = JSON.parse(data);
                ipcRenderer.send('global', {method: 1, prop: "prj", value: obj});
                ipcRenderer.send('maxi_main', {});
                window.location.href = "index.html";
            });
        } catch (e) {
            alert('Project corrupted!');
        }
    });
}

function searchForLastPrj(){
    if(config.get("lastOpendPrj") !== null){
        $('#openLast').removeClass("disabled");
    }
}

function newProjekt() {
    var obj = {"fileJson": [], "backGroundJson": [], "noteBox": "", "pagesSafe": []};
    config.set("lastOpendPrj", null);
    ipcRenderer.send('global', {method: 1, prop: "prj", value: obj});
    ipcRenderer.send('maxi_main', {});
    window.location.href = "index.html";
}