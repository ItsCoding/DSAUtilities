const bcChannel = new BroadcastChannel('bcDSA');
var presentationPaused = false;
var msgCue = [];
var lastPt = null;
var canvas;
var ctx;
var pixelScale;
canvas = document.getElementById("main_canvas");
canvas.height = window.innerHeight;
canvas.width =  window.innerWidth;
ctx = canvas.getContext("2d");


function draw(epy,epx,drawMode,drawColor,linewith,pressure) {
        if(lastPt!=null) {
            ctx.beginPath();
            switch(drawMode){
                case "pen":
                    ctx.globalCompositeOperation="source-over";
                    ctx.moveTo(lastPt.x, lastPt.y);
                    ctx.lineTo(epx, epy);
                    ctx.strokeStyle = drawColor;
                    ctx.lineWidth = (linewith * 2.5) * pressure;
                    ctx.lineCap = "round";
                    ctx.stroke();
                    break;
                case "eraser":
                    ctx.globalCompositeOperation="destination-out";
                    ctx.arc(lastPt.x,lastPt.y,linewith,0,Math.PI*2,false);
                    ctx.fill();
                    break;
            }

        }
        lastPt = {x:epx, y:epy};
}

bcChannel.onmessage = function(e) {
    console.log(e);
    reciveBCMessage(e);
};

function renderIcon(obj,id) {
    var cssClass = "";
    if(obj.fileProppertie.rounded){
        cssClass = "iconDot";
    }
    var html = "";
    obj.fileProppertie.sizeY = obj.fileProppertie.sizeY * pixelScale.y
    obj.fileProppertie.sizeX = obj.fileProppertie.sizeX * pixelScale.x
    if (obj.cssOnly) {
        html = "<span id='" + id + "' class='iconDrag " + cssClass + "' style='background-color: " + obj.fileProppertie.bgColor + ";height: " + obj.fileProppertie.sizeY + "px;width: " + obj.fileProppertie.sizeX + "px;font-size: " + obj.fileProppertie.fontSize + "px'>" + obj.fileProppertie.text + "</span>";
    } else {
        if (obj.fileProppertie.needBackground) {
            html = "<span id='" + id + "' class='iconDrag " + cssClass + "' style='background-color: " + obj.fileProppertie.bgColor + ";height: " + obj.fileProppertie.sizeY + "px;width: " + obj.fileProppertie.sizeX + "'px>" + "#HIER IMAGE EINFÜGEN" + "</span>";
        } else {
            html = '<img id="' + id + '" src="' + obj.prevPath + '" class="iconDrag ' + cssClass + '" style="height: ' + obj.fileProppertie.sizeY + 'px;width: ' + obj.fileProppertie.sizeX + 'px;">';
        }
    }
    $("#canvasDiv").append(html);
}


function reciveBCMessage(e){
    var msg = e.data;
    if(presentationPaused){
        if(msg.type === "unPausePresentation"){
            presentationPaused = false;
            console.log("================== RENDERING MSG CUE LIST =========================");
            for(var i in msgCue){
                console.log("Action: " + msgCue[i].type);
                msgToAction(msgCue[i]);
            }
            msgCue = [];
            console.log("====================================================================")
        }else{
            msgCue.push(msg);
        }
    }else{
        msgToAction(msg);
    }

}

function msgToAction(msg){
    switch(msg.type){
        case "draw":
            draw(msg.epageY,msg.epageX,msg.drawmode,msg.color,msg.lineWidth,msg.pressure);
            break;
        case "scb":
            setCanvasBackground(msg.image);
            break;
        case "getPixel":
            bcChannel.postMessage({type: "core_getPixel",x: $('#canvasDiv').innerWidth(),y: $('#canvasDiv').innerHeight()});
            break;
        case "resetDrawPt":
            lastPt = null;
            break;
        case "resizeBg":
            $('#main_canvas_bg').css("background-size", msg.scale + "%");
            break;
        case "resizeGrid":
            $('#main_canvas_grid').css("background-size", msg.scale + "%");
            break;
        case "insertIcon":
            pixelScale = msg.pixelScale;
            renderIcon(msg.obj,msg.id);
            break;
        case "moveIcon":
            $('#' + msg.id).css({top: msg.y, left: msg.x});
            break;
        case "hardBG":
            $('#main_canvas').css("background-image",'url(' + msg.base64 + ")");
            break;
        case "deleteIcon":
            $('#' + msg.id).remove();
            break;
        case "pausePresentation":
            presentationPaused = true;
            break;
        case "loadPage":
            loadPageFromSafe(msg.uri);
            break;
        case "bgOffset-x":
            $('#main_canvas_bg').css('background-position-x', msg.value +'%');
            break;
        case "bgOffset-y":
            $('#main_canvas_bg').css('background-position-y', msg.value +'%');
            break;
        case "gridOffset-x":
            $('#main_canvas_grid').css('background-position-x', msg.value +'%');
            break;
        case "gridOffset-y":
            $('#main_canvas_grid').css('background-position-y', msg.value +'%');
            break;
        case "changeSize":
            $('#' + msg.id ).height($('#' + msg.id ).height() + msg.value); $('#' + msg.id ).width($('#' + msg.id ).width() + msg.value);
            break;
        case "toggleGrid":
            if(msg.gridOn){
                $('#main_canvas_grid').css("background-image",'url(' + "../images/hexgrid.png" + ")");
            }else{
                $('#main_canvas_grid').css("background-image",'');
            }
            break;
        case "show_rule":
            showRule(msg.url)
            break;
        case "hide_pres":
            $('#pres-div').hide();
            break;
        case "show_loader":
            $.LoadingOverlay("show",{
            text                    : msg.msg
             });
            break;
        case "hide_loader":
            $.LoadingOverlay("hide");
            break;
        case "pres_scroll":
            $('#pres-content').scrollTop(msg.scroll);
            break;
    }
}

function showRule(url){
    $('#pres-content').html(url);
    //$('#pres-div').height(canvas.height + 'px');
    //$('#pres-div').width(canvas.width + 'px');
    $('#pres-div').show();
}

function setCanvasBackground(image){
   $('#main_canvas_bg').css("background-image",'url(' + image + ")");

}

function loadPageFromSafe(uri) {
    var myCanvas = document.getElementById('main_canvas');
    var ctx = myCanvas.getContext('2d');
    var img = new Image;
    img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = uri;
}
