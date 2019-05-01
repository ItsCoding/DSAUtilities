const bcChannel = new BroadcastChannel('bcDSA');
const Store = require('electron-store');
const mergeImages = require('merge-images');
var store = null;
var presSize = [];
var app = require('electron').remote;
const { ipcRenderer } = require('electron')
var dialog = app.dialog;
const path = require('path');
var fs = require('fs');
var canvaseURL = "";
var gridOn = true;
var pagesSafe = [];
var loader_progress = 0;
var noteBox = ""

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function setCanvasBackground(image) {
    canvaseURL = image;
    $('#main_canvas_bg').css("background-image", 'url(' + image + ")");
    bcChannel.postMessage({type: "scb", image: image, gridOn: gridOn});
}

function storeStorrageNode(node, st) {

    ipcRenderer.send('global', {method:1,prop:node,value:st});
}

function getStorrageNode(node) {
    return ipcRenderer.sendSync('global', {method:2,prop:node});
}

bcChannel.onmessage = function (e) {
    reciveMessage(e);
};

function reciveMessage(e) {
    var msg = e.data;
    switch (msg.type) {
        case "core_getPixel":
            presSize = msg;
            pixelScale.x = msg.x / document.getElementById('canvasDiv').clientWidth;
            pixelScale.y = msg.y / document.getElementById('canvasDiv').clientHeight;
            grndScale = (pixelScale.x + pixelScale.y) / 2
            //$('#main_canvas').height($('#main_canvas').height); //(msg.y / 16) * 15.851852);
            break;
        case "core_reload":
            initDSACore();
            break;
    }
}


function addNewFile() {
    dialog.showOpenDialog(function (fileNames) {

        if (fileNames === undefined) return;

        var fileName = fileNames[0];

        processFiles(fileName);

    });
}

function processFiles(fileNames) {
    console.log(fileNames);
    var jsonObj = {
        "name": fileNames.name.substr(0, fileNames.name.indexOf('.')),
        "type": "file",
        "path": fileNames.path,
        "preview": true,
        "cssOnly": false,
        "prevPath": fileNames.path,
        "fileType": "icon",
        "fileProppertie": {
            "needBackground": false,
            "sizeX": "80%",
            "sizeY": "80%"
        }
    };
    fileJson.push(jsonObj);
}



function loadAllVariables() {
    var obj = ipcRenderer.sendSync('global', {method:2,prop:"prj"});
    console.log("IPC init Recieved");
    pagesSafe = obj.pagesSafe;
    $('#noteBox').val(obj.noteBox);
    fileJson = obj.fileJson;
    backGroundJson = obj.backGroundJson;
}


async function initDSACore() {

    loadSearchJsonToBar();
    loadAllVariables();
    window.onbeforeunload = (e) => {
        noteBox = $('#noteBox').val();
    }

    document.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();

        for (let f of e.dataTransfer.files) {
            processFiles(f);
        }
    });
    document.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    renderpagesSafe();
    setupDisplaySettingSelect();
    toggleGrid();
    drawinit();
    renderBacks();
    setCanvasBackground("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=");
    $('#set_zoom_slide').change(function () {
		console.log("BG Zoom called");
        var val = document.getElementById("set_zoom_slide").value;
        bcChannel.postMessage({type: "resizeBg", scale: val});
        $('#main_canvas_bg').css("background-size", val + "%");
        console.debug("Change Background Size to: " + val + "%");

    });
	
	$('#quick_set_zoom_slide').change(function () {
		console.log("BG Zoom called");
        var val = document.getElementById("set_zoom_slide").value;
        bcChannel.postMessage({type: "resizeBg", scale: val});
        $('#main_canvas_bg').css("background-size", val + "%");
        console.debug("Change Background Size to: " + val + "%");

    });

    $('#set_zoom_slide_grid').change(function () {
        var val = document.getElementById("set_zoom_slide_grid").value;
        bcChannel.postMessage({type: "resizeGrid", scale: val});
        $('#main_canvas_grid').css("background-size", val + "%");
        console.debug("Change Grid Size to: " + val + "%");

    });
    //Bring them to same Size on Startup
    bcChannel.postMessage({type: "resizeGrid", scale: 100});
    $('#main_canvas_grid').css("background-size", 100 + "%");


    $('#set_res_slide_y').change(function () {
        var val = document.getElementById("set_res_slide_y").value;
        $('#sizeY_res').text(val);
    });

    $('#set_res_slide_x').change(function () {
        var val = document.getElementById("set_res_slide_x").value;
        $('#sizeX_res').text(val);
    });

    actualSelectedJson = [fileJson];
    renderFileObj(-1);
    $.LoadingOverlay("hide");
}

function loadSearchJsonToBar() {
    $.get("dsa5_rules_tags.txt", function (data, status) {
        var links = JSON.parse(data);
        for (var i in links) {
            var link = links[i];
            $('#dsa_searchbar').append('<option data-tokens="' + link.tags.join(" ") + '" value="' + link.link + '">' + link.tags[link.tags.length - 1] + '</option>')
        }
        $('#dsa_searchbar').selectpicker();
    });
    $('#dsa_searchbar').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        $('#ruleModal').on('scroll', function () {
            bcChannel.postMessage({type: "pres_scroll", scroll: $(this).scrollTop()});
        });
        bcChannel.postMessage({type: "show_loader", msg: "Loading rule..."});
        var val = $('#dsa_searchbar').val();
        $.get("https://www.ulisses-regelwiki.de/index.php/" + val, function (data, status) {
            var content = data.replace(/(\r\n|\n|\r)/gm, "");
            content = content.match(new RegExp('<div id="main">(.*)<footer id="footer" class="sfooter">'))
            var htmlc = content[1].replaceAll('border-left: 1px solid #d1c9c9;', "");
            htmlc = htmlc.replaceAll('background-color: white;', "");
            console.log("Content: " + htmlc)
            bcChannel.postMessage({type: "show_rule", url: htmlc});
            bcChannel.postMessage({type: "hide_loader"});
            $('#rule_content').html(htmlc);
            $('#ruleModal').modal('show');
        });

    });
    $('#ruleModal').on('hidden.bs.modal', function (e) {
        bcChannel.postMessage({type: 'hide_pres'});
        $("#ruleModal").off("scroll");
    });

}


function newProjekt() {
    var obj = {"fileJson": [], "backGroundJson": [], "noteBox": "","pagesSafe": []};

    ipcRenderer.send('global', {method:1,prop:"prj",value:obj});
    var bcChannel = new BroadcastChannel('bcDSA');
    bcChannel.postMessage({
        type: "core_reload"
    });
    $.notify({
        // options
        icon: 'fas fa-folder-plus',
        message: "New projekt loaded",
        target: '_blank'
    }, {
        // settings
        element: 'body',
        position: null,
        type: "info",
        allow_dismiss: true,
        newest_on_top: false,
        showProgressbar: false,
        placement: {
            from: "top",
            align: "right"
        },
        animate: {
            enter: 'animated fadeInDown',
            exit: 'animated fadeOutUp'
        },
        onShow: null,
        onShown: null,
        onClose: null,
        onClosed: null,
        icon_type: 'class'
    });
}

function openprj() {
    dialog.showOpenDialog({
        filters: [

            {name: 'DSAUtilites Projektfile', extensions: ['dsa']}

        ]
    }, function (fileNames) {
        try {
            if (fileNames === undefined) return;
            $.LoadingOverlay("show", {
                text: "Loading projekt : " + path.basename(fileNames[0]),
                progress: true
            });
            setTimeout(function () {
                var data = fs.readFileSync(fileNames[0]);
                config.set("lastOpendPrj", fileNames[0])
                var obj = JSON.parse(data);
                ipcRenderer.send('global', {method:1,prop:"prj",value:obj});
                var bcChannel = new BroadcastChannel('bcDSA');
                bcChannel.postMessage({
                    type: "core_reload"
                });
            }, 500);
        } catch (e) {
            alert('Project corrupted!');
        }


    });
}

function addNewPage() {
    var name = $('#pages_pageName').val();
    var obj = {name: name, image: document.getElementById("main_canvas").toDataURL(), canvasURL: canvaseURL};
    pagesSafe.push(obj);
    storeStorrageNode("pagesSafe", pagesSafe);
    renderpagesSafe();
}


function addNewBackgroundFromCanvas() {
    var name = $('#pages_pageName').val();
    var img = mergeImages([document.getElementById("main_canvas").toDataURL(), canvaseURL]).then(function (b64) {
        var obj = {name: name, base64: b64, canvasURL: canvaseURL};
        backGroundJson.push(obj);
        storeStorrageNode('backGroundJson', backGroundJson);
        renderBacks();
    });
}


function renderpagesSafe() {
    $('#pages_table').html("");
    for (var i in pagesSafe) {
        $('#pages_table').append(' <tr>\n' +
            '    <td>' + pagesSafe[i].name + '</td>\n' +
            '    <td>' +
            '<div class="btn-group" role="group">\n' +
            '  <button type="button" class="btn btn-primary" onClick="loadPageFromSafe(' + i + ')">Load</button>\n' +
            '  <button type="button" class="btn btn-danger" onClick="deletePageFromSafe(' + i + ')">Delete</button>\n' +
            '</div>' +
            '</td>\n' +
            '  </tr>')
    }
}

function loadPageFromSafe(id) {
    var myCanvas = document.getElementById('main_canvas');
    var ctx = myCanvas.getContext('2d');
    var img = new Image;
    img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = pagesSafe[id].image;
    bcChannel.postMessage({type: "loadPage", uri: pagesSafe[id].image});
    setCanvasBackground(pagesSafe[id].canvasURL)
}

function deletePageFromSafe(id) {
    pagesSafe.splice(id, 1);
    storeStorrageNode("pagesSafe",pagesSafe);
    renderpagesSafe();
}


function saveprj() {
    dialog.showSaveDialog({
        filters: [{
            name: 'DSAUtilites Projektfile', extensions: ['dsa']
        }]
    }, (fileName) => {
        if (fileName === undefined) {
            console.log("You didn't save the file");
            return;
        }
        var jsonObj = {
            fileJson: fileJson,
            backGroundJson: backGroundJson,
            noteBox: $('#noteBox').val(),
            pagesSafe: pagesSafe
        };

        fs.writeFile(fileName, JSON.stringify(jsonObj), (err) => {
            if (err) {
                alert("An error ocurred creating the file " + err.message)
            }
            config.set("lastOpendPrj", fileName)
        });
    });
}

function togglePauseMode() {
    var status = document.getElementById("gset_pause").checked;
    if (status) {
        bcChannel.postMessage({
            type: "pausePresentation"
        });
    } else {
        bcChannel.postMessage({
            type: "unPausePresentation"
        });
    }
}

function toggleGrid() {

    gridOn = document.getElementById("gset_grid").checked;
    if (gridOn) {
        $('#main_canvas_grid').css("background-image", 'url(' + "images/hexgrid.png" + ")");
    } else {
        $('#main_canvas_grid').css("background-image", '');
    }
    bcChannel.postMessage({type: "toggleGrid", gridOn: gridOn});

}

//Intense Loading performance
function setupDisplaySettingSelect() {
    var displays = getStorrageNode("temp_foundDisplays")
    var aktualDisplay = getStorrageNode("screen_externalDisplay")
    for (var dsp in displays) {
        var bounds = parseInt(displays[dsp].bounds.x) + parseInt(displays[dsp].bounds.y);
        if (bounds !== 0) {
            var selected = "";
            if (aktualDisplay.bounds.x === displays[dsp].bounds.x && aktualDisplay.bounds.x === displays[dsp].bounds.x) selected = "selected";


            $('#settings_displaySelect').append("<option + " + selected + " value='" + dsp + "'>Monitor " + dsp + "</option>");


        }
    }

    $("#settings_displaySelect").change(function () {
        var displays = getStorrageNode("temp_foundDisplays")
        var select = $('#settings_displaySelect').val();
        if (displays.length > 1) {
            storeStorrageNode("screen_fullscreen", true);
        }
        storeStorrageNode("screen_externalDisplay", displays[select]);

        $.notify({
            // options
            icon: 'fas fa-power-off',
            message: "Restart DSAUtility to see changes",
            target: '_blank'
        }, {
            // settings
            element: 'body',
            position: null,
            type: "info",
            allow_dismiss: true,
            newest_on_top: false,
            showProgressbar: false,
            placement: {
                from: "top",
                align: "right"
            },
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            },
            onShow: null,
            onShown: null,
            onClose: null,
            onClosed: null,
            icon_type: 'class'
        });
    });

}

function debug_massiveImport(folderName, sizex, sizey) {
    dialog.showOpenDialog({
        properties: ["multiSelections"]
    }, function (fileNames) {

        var newIcons = [];
        try {
            if (fileNames === undefined) return;
            for (var i in fileNames) {
                var data = fs.readFileSync(fileNames[i]);
                var baseName = path.basename(fileNames[i]);
                var name = baseName.slice(0, baseName.indexOf("."));
                var base64Image = new Buffer.from(data, 'binary').toString('base64');
                let imgSrcString = `data:image/${baseName.split('.').pop()};base64,${base64Image}`;
                var jsonObj = {
                    "name": name,
                    "type": "file",
                    "path": imgSrcString,
                    "preview": true,
                    "cssOnly": false,
                    "prevPath": imgSrcString,
                    "fileType": "icon",
                    "fileProppertie": {
                        "needBackground": false,
                        "sizeX": sizex,
                        "sizeY": sizey,
                        "opacity": 100,
                        "rounded": false
                    },
                    "iconProps": {
                        "speed": 0,
                        "name": name,
                        "life": 0,
                        "npc": false
                    }
                };
                newIcons.push(jsonObj);
            }


        } catch (e) {
            alert('Project corrupted!');
        }
        var folder = {name: folderName, type: "folder", childs: newIcons}
        fileJson.push(folder);
        storeStorrageNode("fileJson", fileJson);

    });
}

//Dumb idea... useless because winning size is to low
function toggleSideMenu(tgl) {
    if (tgl) {
        $('#sidemenu').removeClass("col-3");
        $('#sidemenu').addClass("col-2");

        $('#draw-frame').removeClass("col-9");
        $('#draw-frame').addClass("col-10");
    }else{
        $('#sidemenu').removeClass("col-2");
        $('#sidemenu').addClass("col-3");

        $('#draw-frame').removeClass("col-10");
        $('#draw-frame').addClass("col-9");
    }
    pixelScale.x = presSize.x / document.getElementById('canvasDiv').clientWidth;
    pixelScale.y = presSize.y / document.getElementById('canvasDiv').clientHeight;
}
