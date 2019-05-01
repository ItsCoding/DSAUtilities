var fileJson;
var backGroundJson;
var drawSettingsJson;
var currentFolder = -1;
var openInfo = {itemIndex: "null", folderDepth: -1};
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const dialog = require('electron').remote.dialog;
var fs = require('fs');


fileJson = getStorrageNode('fileJson');
backGroundJson = getStorrageNode('backGroundJson');


function renderFileObj(data, deep = 0) {
    $('#fb_data').text("");
    if (deep > 0) {
        $('#fb_data').append('<li a href="#" class="list-group-item list-group-item-action" onClick=' + "'renderFileObj(" + JSON.stringify(fileJson) + ");currentFolder = -1;'" + '><i class="fas fa-folder-open"></i> ' + "Back" + '</li>');
    } else {
        $('#fb_data').append('<li a href="#" class="list-group-item list-group-item-action active"> <div class="form-inline my-2 my-lg-0"> <input id="newFolderName" class="form-control mr-sm-2" type="text" placeholder=""> <button class="btn btn-secondary my-2 my-sm-0" onClick="addNewFolder();">New Folder</button> </div></li>');

    }
    for (var i in data) {
        var obj = data[i];
        if (obj.type === "folder") {
            $('#fb_data').append('<li a href="#" class="list-group-item d-flex justify-content-between align-items-center list-group-item-action" onClick=' + "'renderFileObj(" + JSON.stringify(obj.childs) + ",1); currentFolder = " + i + ";'" + '><i class="fas fa-folder-open"></i> ' + obj.name + '<span class="badge badge-danger badge-pill" onClick="deleteItem(' + i + ')"><i class="fas fa-trash-alt"></i></span></li>');
        }
        if (obj.type === "file") {
            var icon = "";
            if (obj.preview) {
                if (obj.cssOnly) {
                    icon = renderCssIconPrev(obj);
                } else {
                    icon = '<img src="' + obj.prevPath + '" class="roundImg">';
                }
            } else {
                icon = '<i class="fas fa-file"></i>';
            }
            $('#fb_data').append('<li a href="#" class="list-group-item d-flex justify-content-between align-items-center list-group-item-action" onClick=' + "'chooseFile(" + JSON.stringify(obj) + "," + i + ")'" + '>' + icon + " " + obj.name + '<span class="badge badge-danger badge-pill" onClick="deleteItem(' + i + ')"><i class="fas fa-trash-alt"></i></span></li>');
        }
    }
}

function deleteBackground(id) {
    backGroundJson.splice(id, 1);
    renderBackgroundJson(backGroundJson);
}

function renderPreview(id) {
    var bg = backGroundJson[id].base64;
    document.getElementById("bg_img_prev").src = bg;
}

function renderBackgroundJson(data) {
    $('#bg_table').html("");
    for (var i in data) {
        var html = ' <tr data-base64="' + data[i].base64 + '" data-arrayid="' + i + '">\n' +
            '                                <th scope="row">' + data[i].name + '</th>\n' +
            '                                <td><button type="button" class="btn btn-outline-primary" onclick="renderPreview(\'' + i + '\')">Show preview</button>   <button type="button" class="btn btn-outline-danger" onClick="deleteBackground(\'' + i + '\')"><i class="fas fa-trash-alt"></i> Delete background</button></td>\n' +
            '                            </tr>';
        $('#bg_table').append(html);
    }
}

$(document).ready(function () {
    renderFileObj(fileJson);
    renderBackgroundJson(backGroundJson);
});

function chooseFile(data, index) {
    console.log(data);
    $('#adsICBtn').text("Save");
    $('#adsICBtn').removeClass("btn-success");
    $('#adsICBtn').addClass("btn-primary");


    openInfo.itemIndex = index;
    openInfo.folderDepth = currentFolder;
    document.getElementById("icname").value = data["name"];
    document.getElementById("icImgBox").src = data["path"];
    document.getElementById("icsizex").value = data["fileProppertie"]["sizeX"];
    document.getElementById("icsizey").value = data["fileProppertie"]["sizeY"];
    document.getElementById("ic_trans_set").value = data["fileProppertie"]["opacity"] * 100;
    document.getElementById("ic_set_round").checked = data["fileProppertie"]["rounded"];
    resizeImage();
    $('#icImgBox').css('top', 0).css('left', 0);
    boxRoundedToggle();
    document.getElementById("icImgBox").style.opacity = document.getElementById("ic_trans_set").value / 100;

    //IconProps Here
    document.getElementById("icp_name").value = data["iconProps"]["name"];
    document.getElementById("icp_life").value = data["iconProps"]["life"];
    document.getElementById("icp_speed").value = data["iconProps"]["speed"];

    if(data["iconProps"]["npc"]){
        document.getElementById("icp_npc").checked = true;
    }else{
        document.getElementById("icp_npc").checked = true;
    }

}


function storeStorrageNode(node, st) {
    store.set(node, st);
}

function getStorrageNode(node) {
    return store.get(node);
}


function openImageFile() {

    dialog.showOpenDialog({
        filters: [

            {name: 'Images', extensions: ['jpg', "png"]}

        ]
    }, function (fileNames) {

        if (fileNames === undefined) return;

        var fileName = fileNames[0];
        let extensionName = path.extname(fileName);
        var data = fs.readFileSync(fileName);
        let base64Image = new Buffer.from(data, 'binary').toString('base64');
        console.log({"Message": "Base64Encode String", "base64": base64Image});
        //combine all strings
        let imgSrcString = `data:image/${extensionName.split('.').pop()};base64,${base64Image}`;

        document.getElementById("icImgBox").src = imgSrcString;


    });

}


function openBgFile() {

    dialog.showOpenDialog({
        filters: [

            {name: 'Images', extensions: ['jpg', "png"]}

        ]
    }, function (fileNames) {

        if (fileNames === undefined) return;

        var fileName = fileNames[0];
        let extensionName = path.extname(fileName);
        var data = fs.readFileSync(fileName);
        let base64Image = new Buffer.from(data, 'binary').toString('base64');
        console.log({"Message": "Base64Encode String", "base64": base64Image});
        //combine all strings
        let imgSrcString = `data:image/${extensionName.split('.').pop()};base64,${base64Image}`;
        document.getElementById("bgbase").value = imgSrcString;
    });

}

function addNewFolder() {
    var jsonObj = {
        "name": $("#newFolderName").val(),
        "type": "folder",
        "childs": []
    };
    fileJson.push(jsonObj);
    renderFileObj(fileJson);
}

function addNewBackground(){
    var jsonObj = {
        "name": $("#bgname").val(),
        "base64": $("#bgbase").val()
    };
    if (document.getElementById("bgname").value.length > 0){
        backGroundJson.push(jsonObj);
        renderBackgroundJson(backGroundJson);
    }else{
        $.notify({
            // options
            icon: 'fas fa-exclamation-triangle',
            message: "No background name provided!",
            target: '_blank'
        }, {
            // settings
            element: 'body',
            position: null,
            type: "warning",
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

}


function resizeImage() {
    document.getElementById("icImgBox").style.width = document.getElementById("icsizex").value;
    document.getElementById("icImgBox").style.height = document.getElementById("icsizey").value;
}

function boxRoundedToggle() {
    if (document.getElementById("ic_set_round").checked) {
        document.getElementById("icImgBox").classList.add("iconDot");
    } else {
        document.getElementById("icImgBox").classList.remove("iconDot");
    }
}


function addOrSaveIcon() {
    var jsonObj = {
        "name": document.getElementById("icname").value,
        "type": "file",
        "path": document.getElementById("icImgBox").src,
        "preview": true,
        "cssOnly": false,
        "prevPath": document.getElementById("icImgBox").src,
        "fileType": "icon",
        "fileProppertie": {
            "needBackground": false,
            "sizeX": document.getElementById("icsizex").value,
            "sizeY": document.getElementById("icsizey").value,
            "opacity": document.getElementById("ic_trans_set").value / 100,
            "rounded": document.getElementById("ic_set_round").checked
        },
        "iconProps": {
            "speed": document.getElementById("icp_speed").value,
            "name" : document.getElementById("icp_name").value,
            "life" : document.getElementById("icp_life").value,
            "npc" : document.getElementById("icp_npc").checked

        }
    };
    if (openInfo.itemIndex == "null") {
        if (document.getElementById("icname").value.length > 1 && document.getElementById("icImgBox").src.length !== 43) {
            if (currentFolder < 0) {
                fileJson.push(jsonObj);
                renderFileObj(fileJson);
            } else {
                fileJson["" + currentFolder + ""]['childs'].push(jsonObj);
                renderFileObj(fileJson["" + currentFolder + ""].childs, 1);
            }
        } else {
            var messageStr;
            switch (true) {
                case (document.getElementById("icname").value.length < 1 && document.getElementById("icImgBox").src.length === 43):
                    messageStr = "No name and image path provided!";
                    break;
                case (document.getElementById("icname").value.length < 1):
                    messageStr = "No name provided!";
                    break;
                case (document.getElementById("icImgBox").src.length === 43):
                    messageStr = "No image path provided!";
                    break;
            }

            $.notify({
                // options
                icon: 'fas fa-exclamation-triangle',
                message: messageStr,
                target: '_blank'
            }, {
                // settings
                element: 'body',
                position: null,
                type: "warning",
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

    } else {
        console.log("Saving Item: ");
        console.log(jsonObj);
        if (openInfo.folderDepth < 0) {
            fileJson[openInfo.itemIndex] = jsonObj;
            renderFileObj(fileJson);
        } else {
            console.log("Folder Depth = " + openInfo.folderDepth);
            fileJson[openInfo.folderDepth]["childs"][openInfo.itemIndex] = jsonObj;
            renderFileObj(fileJson["" + currentFolder + ""].childs, 1);
        }
    }
}

function deleteItem(index) {
    if (currentFolder < 0) {
        fileJson.splice(index, 1);
    } else {
        fileJson[currentFolder]["childs"].splice(index, 1);
    }
    renderFileObj(fileJson, 0);
}


document.getElementById("importImageBtn").addEventListener("click", function () {
    openImageFile();
});
document.getElementById("adsICBtn").addEventListener("click", function () {
    addOrSaveIcon();
});
document.getElementById("newIconBtn").addEventListener("click", function () {
    openInfo = {itemIndex: "null", folderDepth: -1};
    $('#adsICBtn').text("Add Icon");
    $('#adsICBtn').addClass("btn-success");
    $('#adsICBtn').removeClass("btn-primary")
    document.getElementById("icname").value = "";
    document.getElementById("icImgBox").src = "";
    document.getElementById("icsizex").value = "";
    document.getElementById("icsizey").value = "";
    document.getElementById("ic_trans_set").value = 100;
    document.getElementById("ic_set_round").checked = false;

    document.getElementById("icp_name").value = "";
    document.getElementById("icp_life").value = "";
    document.getElementById("icp_speed").value = "";
    resizeImage();
    $('#icImgBox').css('top', 0).css('left', 0);
    boxRoundedToggle();
    document.getElementById("icImgBox").style.opacity = document.getElementById("ic_trans_set").value / 100
});
document.getElementById("resizeImageBtn").addEventListener("click", function () {
    resizeImage();
});
document.getElementById("ic_set_round").addEventListener("change", function () {
    boxRoundedToggle();
});
document.getElementById("ic_trans_set").addEventListener("change", function () {
    document.getElementById("icImgBox").style.opacity = document.getElementById("ic_trans_set").value / 100;
});

document.getElementById("importBgBtn").addEventListener("click", function () {
    openBgFile();
});

function finishProjekt(){
    storeStorrageNode("fileJson",fileJson);
    storeStorrageNode("backGroundJson",backGroundJson);
    var bcChannel = new BroadcastChannel('bcDSA');
    bcChannel.postMessage({
        type: "core_reload"
    })
    window.close();
}

