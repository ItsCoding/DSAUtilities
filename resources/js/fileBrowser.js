var fileJson = []; //Load through Setup
var moveIconoff = {x: -35, y: 60};
var lastFocused = "";
var backGroundJson = []; //Load through Setup
var selectedObjs;
var actualSelectedJson = null;
var draggableOptions = {
    start: function (event, ui) {
        //get all selected...
        if (ui.helper.hasClass('selected')) selectedObjs = $('div.selected');
        else {
            selectedObjs = $(ui.helper);
            $('div.selected').removeClass('selected')
        }
    },
    drag: function (event, ui) {
        var currentLoc = $(this).position();
        var prevLoc = $(this).data('prevLoc');
        if (!prevLoc) {
            prevLoc = ui.originalPosition;
        }

        var offsetLeft = currentLoc.left - prevLoc.left;
        var offsetTop = currentLoc.top - prevLoc.top;

        moveSelected(offsetLeft, offsetTop);
        selectedObjs.each(function () {
            $(this).removeData('prevLoc');
        });
        $(this).data('prevLoc', currentLoc);
    }
};

function goBack(){
    actualSelectedJson = actualSelectedJson.slice(0,-1);
}

function renderFileObj(index , dp) {
    var deep = dp || 0
    $('#fb_data').text("");
    if(index > -1){
        var js = actualSelectedJson[actualSelectedJson.length - 1];
        actualSelectedJson.push(js[index].childs);
    }
    if (deep > 0) {
        $('#fb_data').append('<a a href="#" class="list-group-item list-group-item-action" onClick=' + "'goBack();renderFileObj(" + -1 + ")'" + '><i class="fas fa-folder-open"></i> ' + "Back" + '</a>');
    }
    var data = actualSelectedJson[actualSelectedJson.length - 1];
    for (var i in data) {
        var obj = data[i];
        if (obj.type === "folder") {
            $('#fb_data').append('<a a href="#" class="list-group-item list-group-item-action" onClick=' + "'renderFileObj(" + i + "," + parseInt(deep + 1).toString() + ")'" + '><i class="fas fa-folder-open"></i> ' + obj.name + '</a>');
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
            $('#fb_data').append('<a a href="#" class="list-group-item list-group-item-action" onClick=' + "'chooseFile(" + i + ")'" + '>' + icon + " " + obj.name + '</a>');
        }
    }
}

function chooseFile(index) {
    var data = actualSelectedJson[actualSelectedJson.length - 1];
    var obj = data[index];
    switch (obj.fileType) {
        case "icon":
            renderIcon(obj);
    }
}

function moveSelected(ol, ot) {
    selectedObjs.each(function () {
        $this = $(this);
        var p = $this.position();
        var l = p.left;
        var t = p.top;
        $this.css('left', l + ol);
        $this.css('top', t + ot);

        bcChannel.postMessage({
            type: "moveIcon",
            id: $(this).attr("id"),
            x: ($(this).offset().left) * pixelScale.x,
            y: ($(this).offset().top - $('#main_canvas').offset().top) * pixelScale.y
        })
    })
}

function generateRandomNumber(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function renderBacks() {
    $('#bg_data').html("");
    for (var i in backGroundJson) {
        $('#bg_data').append('<a a href="#" class="list-group-item list-group-item-action" onClick=' + "'selectBackground(" + i + ")'" + '> ' + backGroundJson[i].name + '</a>');
    }
}

function selectBackground(id) {
    var obj = backGroundJson[id];
    setCanvasBackground(obj.base64);
}

function renderIcon(obj) {
    var cssClass = "";

    // NEW VERSION Compatiblity

    if (obj.iconProps == undefined) {
        obj.iconProps = {
            "name": "",
            "life": "",
            "speed": "",
            "npc": false
        }
        console.log({"message": "Fixed missing IconProps", "obj": obj});
    }

    // NEW VERSION Compatiblity END
    if (obj.fileProppertie.rounded) {
        cssClass = "iconDot";
    }
    var id = "cvs_obj-" + Math.floor(Math.random() * 9999999999);
    var html = "";
    bcChannel.postMessage({type: "insertIcon", obj: obj, pixelScale: pixelScale, id: id});

    if (obj.fileProppertie.needBackground) {
        html = "<span id='" + id + "' class='iconDrag " + cssClass + "' style='background-color: " + obj.fileProppertie.bgColor + ";height: " + obj.fileProppertie.sizeY + "px;width: " + obj.fileProppertie.sizeX + "px' data-life='0'>" + "#HIER IMAGE EINFÜGEN" + "</span>";
    } else {
        html = '<div data-icname=\'' + obj.iconProps.name + '\' data-enablelf="true" class="iconDrag" data-life=\'' + obj.iconProps.life + '\'  id="' + id + '" ><img src="' + obj.prevPath + '" class="' + cssClass + '" style="height: ' + obj.fileProppertie.sizeY + 'px;width: ' + obj.fileProppertie.sizeX + 'px;" id="' + id + '-img" ></div>';
    }

    $("#canvasDiv").append(html);
    $('#' + id).draggable(draggableOptions);

    $('#health_menu').append(' <tr id="' + id + '-table-row">\n' +
        '      <th scope="row" id="' + id + '-table-name">' + "" + '</th><td><button class="badge badge-primary" onClick="$(this).text(\'W20: \' + generateRandomNumber(1,20))">W20: ' + generateRandomNumber(1, 20) + '</button>  <button class="badge badge-primary" onClick="$(this).text(\'W6: \' + generateRandomNumber(1,6))">W6: ' + generateRandomNumber(1, 6) + '</button></td><td><div class="progress">\n' +
        '  <div id="' + id + '-table-progress" class="progress-bar bg-success" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="padding-left:5px;"></div>\n' +
        '</div>' +
        '</td></tr>');

    $('#' + id).contextmenu(function () {
        $(this).toggleClass('selected');
    });

    $('#' + id).on("move", function (e) {
        var ownPixelScale = {
            "x": (presSize.x - moveIconoff.x) / document.getElementById('canvasDiv').clientWidth,
            "y": (presSize.y - moveIconoff.y) / document.getElementById('canvasDiv').clientHeight
        }
        var x = $(this)
        bcChannel.postMessage({
            type: "moveIcon",
            id: id,
            x: ($(this).offset().left) * pixelScale.x,
            y: ($(this).offset().top - $('#main_canvas').offset().top) * pixelScale.y
        })
        ;
    });

    changeIconName(id, obj.iconProps.name);
    $('#' + id).attr('data-maxlf', obj.iconProps.life);
    changeProgressBar(id, obj.iconProps.life);
    $('#' + id).on("click", function (e) {
        console.error("ID Clicked:" + $(this).attr("id"));
        lastFocused = $(this).attr("id");
        var life = $(this).attr("data-life");
        console.log("Life Icon: " + life);
        var ck = $(this).attr("data-enablelf");
        $('#icon_set_name').val($('#' + id).attr("data-icname"));
        if (ck == "true") {
            $('#npc_checkbox').prop("checked", true);
        } else {
            $('#npc_checkbox').prop("checked", false);
        }
        $('#dmg_akt').text(life);
        $('#icon_set_modal').modal('show');
    });


    $('#' + id + "-table-progress").on("click", function (e) {
        lastFocused = $(this).attr("id").replace("-table-progress", "");
        var life = $("#" + lastFocused).attr("data-life");
        console.log("Life Icon: " + life);
        var ck = $("#" + lastFocused).attr("data-enablelf");
        $('#icon_set_name').val($('#' + id).attr("data-icname"));
        if (ck == "true") {
            $('#npc_checkbox').prop("checked", true);
        } else {
            $('#npc_checkbox').prop("checked", false);
        }
        $('#dmg_akt').text(life);
        $('#icon_set_modal').modal('show');
    });
    if(obj.iconProps.npc){
        $("#" + id).attr("data-enablelf","true");
        $("#" + id + "-table-row").show();
    }else{
        $("#" + id).attr("data-enablelf","false");
        $("#" + id + "-table-row").hide();
    }

}

function changeProgressBar(id, value) {
    var mxLife = $('#' + id + "").attr("data-maxlf");
    var width = (value / parseInt(mxLife)) * 100;
    $('#' + id + '-table-progress').removeClass("bg-success");
    $('#' + id + '-table-progress').removeClass("bg-danger");
    $('#' + id + '-table-progress').removeClass("bg-warning");
    if (value < 16 && value > 5) {
        $('#' + id + '-table-progress').addClass("bg-warning");
    } else if (value < 6) {
        $('#' + id + '-table-progress').addClass("bg-danger");
    } else {
        $('#' + id + '-table-progress').addClass("bg-success");
    }
    $('#' + id + '-table-progress').width(width + "%");
    $('#' + id + '-table-progress').text(value + "/" + mxLife);
}

function changeIconName(id, text) {
    console.log("Change Text to: " + text);
    $('#' + id).attr("data-icname", text);
    $('#' + id + "-table-name").text(text);
}

function renderCssIconPrev(obj) {
    var cssClass = "";
    switch (obj.fileProppertie.shape) {
        case "rect":
            cssClass = "iconRect";
            break;
        default:
            cssClass = "iconDot";
            break;
    }
    var html = "<span class='" + cssClass + "' style='background-color: " + obj.fileProppertie.bgColor + ";height: 32px;width: 32px; margin-right: 15px;font-size: 8px'>" + obj.fileProppertie.text + "</span>";
    return html;
}




