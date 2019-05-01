var lastPt = null;
var canvas;
var ctx;
var drawColor = "black";
var drawMode = "pen";
var pixelScale = {x: 0.000, y: 0.000};
var grndScale;
var lineWidth = 2;
var bgScale;
var debugMode = false;
var zoomed = false;
var curs_off = {y: 0, x: 0};
var pointerIcon_path = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEFElEQVRogd2Zz2/cRBTHv2+8642bH1uIFEJaWkIrRA6c+Ae4cEJcKlohLoCQSFAFpVKvSFVPiB9FtGnaClShcEAqDUUtSBxAIA5wQRyQIECSJhHpakNp2jRhvbteezg0jpyJxx6PZ5vC52av57355r35+m0W+I9DAICjnD3Ut/IcCOQE9fO/HOxb3eJ9KUMAMDAx9wG1rBftpe0AcIsI5xj5o9PD22e2dnvpMAAAgXm9y2jeexMAejjHa35gTQ2eXr08eGb1CXBOW7rLBAgA9nxa7VvtWqpyFlDxehlrlYjyGxFOOr47fre11/pf9v5LMz/629zHAEAiArgL22tdwM5P/ny8ec/yN+F1gggA4AB9AcKJ2eHOr0DE271RGRt6u//yVDVwGveF1ykiQiaJMLpV7cWiF4W6/W70OnKwkxjiHKdqzFl48PSt43vP3txjepNJbHQXzqn/yz/coOiVorcVK7Ee5U621yZ7HJiY/bhV/ucZ8X5GESFtb69NAqKWKn6mKQIAljn4uQILTpl2r9gXVNRSRXKIANrQXrECREsVySkiZJKAk07gfpSnvaQjgmipIoZEADnbi8k+EC1VRNFiVSgT6LDu7CV/UGKpIgYrEUW5vaQVABFnNftiWiaDlYgyxIExlZdjYqmSLFWkTZUI4eD0OQEnrrzc+XXUvVI3lmSpIm0WETLJgffmFrvex1EK5C20htWwj6hGblM7iQwRcGawf+UFIOkMrLGw/4FvmVtaVI1+h0SAc/iAggAg3VJF2iximgMjc4vd44DCGQCgbKkihs/EDwH4W/O93ZdwgPzwZkFpKRFnE7MXg7K3aUpNwutdBoBcsxMBn1HA35452PN97NZUI2WxVBGNStSJ40Ow4PiVkfJU0oOZNpPFUkUURfzNgdGCh7HpV7uvqcRVa6E1rIZ9xN/mSqfUJFLaaZoT3mlS13hlmGpZ4mZuh7QpNQ2hErEHMwuZKgDcttSm03hDJxlwuxIUsPnSUvezsoOZhez/MtS01CjFG50jV/cPntVdH0XpRbYBxSlVmrBhr5jaPKAjAIBDziEKmNb3WdYojemsk8bTWTSzr/8vVi/9lHUdtSyvcm3X6zo5ZWgJALJNqetr3I4LGCZPN2cc2gKyTqnwrYB48RXdfDK0BQDZptSi2/Hd1X07r+fJF0cuAQtP73qTecVG6oMBwW7aI3lyycglQNVSrVrHr7MHdvyeK5eEfAKgZqnkFw7lzSONbSJI0pTK3I5K9am9O0zkiY1vIkiSpVp165iJHDKM/XwaN6Wyhr1SffLhHlM54jBSASDeUk2PDXGY+wFbmFKpZXmL8490mn7zihirAIg4c0sXwkur5pxv9+YBjS80SVR+3v38wKNzHoiCSmv3SyZj/2/5F0/j6tN7Ay6pAAAAAElFTkSuQmCC";
var pointerIcon = {"name":"","type":"file","path":pointerIcon_path,"preview":true,"cssOnly":false,"prevPath":pointerIcon_path,"fileType":"icon","fileProppertie":{"needBackground":false,"sizeX":"48","sizeY":"48","opacity":1,"rounded":false},"iconProps":{"speed":"","name":"","life":""}}
var tg = false;

function switchDrawMode(mode) {
    drawMode = mode;
}

function togglePointer(){
    tg = !tg;
    if(tg){
        bcChannel.postMessage({type: "insertIcon", obj: pointerIcon, pixelScale: pixelScale, id: "sys_pointer"});
        $('#canvasDiv').mousemove(function(event) {
            var left = event.pageX - $(this).offset().left;
            var top = event.pageY - $(this).offset().top;
            bcChannel.postMessage({
                type: "moveIcon",
                id: "sys_pointer",
                x: (left) * pixelScale.x,
                y: (top) * pixelScale.y
            });
        });
    }else{
        $('#canvasDiv').unbind("mousemove");
        bcChannel.postMessage({type: 'deleteIcon',id: "sys_pointer"});
    }
}


function cleanCanvas(){
    var myCanvas = document.getElementById('main_canvas');
    var ctx = myCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bcChannel.postMessage({type: "loadPage",uri: document.getElementById("main_canvas").toDataURL()});
}


function drawinit() {
    console.debug("Draw Init called");
    canvas = document.getElementById("main_canvas");
    canvas.height = document.getElementById('canvasDiv').clientHeight;
    canvas.width = document.getElementById('canvasDiv').clientWidth;
    ctx = canvas.getContext("2d");
    if (window.PointerEvent) {
        canvas.addEventListener("pointerdown", function () {
                canvas.addEventListener("pointermove", draw, false);
            }
            , false);
        canvas.addEventListener("pointerup", endPointer, false);
    }
    bcChannel.postMessage({type: "getPixel"});
}


function draw(e) {
    if (e.pointerType === "pen" || debugMode) {
        if (lastPt != null) {
            ctx.beginPath();
            switch (drawMode) {
                case "pen":

                    ctx.globalCompositeOperation = "source-over";
                    ctx.moveTo(lastPt.x, lastPt.y - $('#main_canvas').offset().top);
                    ctx.lineTo(e.pageX, e.pageY - $('#main_canvas').offset().top);
                    ctx.strokeStyle = drawColor;
                    ctx.lineWidth = (lineWidth * 2.5) * e.pressure;
                    ctx.lineCap = "round";
                    ctx.stroke();
                    break;
                case "eraser":

                    ctx.globalCompositeOperation = "destination-out";
                    ctx.arc(lastPt.x, lastPt.y - $('#main_canvas').offset().top, lineWidth, 0, Math.PI * 2, false);
                    ctx.fill();
                    break;
                case "zoom":


                    break;
            }

        }
        bcChannel.postMessage({
            type: "draw",
            epageY: (e.pageY - $('#main_canvas').offset().top) * pixelScale.y,
            epageX: e.pageX * pixelScale.x,
            drawmode: drawMode,
            color: drawColor,
            lineWidth: lineWidth * grndScale,
            pressure: e.pressure
        });
        lastPt = {x: e.pageX, y: e.pageY};
    }

}

function endPointer(e) {
    canvas.removeEventListener("pointermove", draw, false);
    canvas.removeEventListener("mousemove", draw, false);
    bcChannel.postMessage({type: "resetDrawPt"});
    lastPt = null;
}



