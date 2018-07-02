/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, window, location, CSInterface, SystemPath, themeManager*/
// Birdy 18.6.12


var csInterface = new CSInterface();
var gExtensionID = csInterface.getExtensionID();

// some events we are interested in
var eventMake = 1298866208;     // "Mk  "
var eventDelete = 1147958304;   // "Dlt " 
var eventClose = 1131180832;    // "Cls " 
var eventSelect = 1936483188;   // "slct" 
var eventSet = 1936028772;      // "setd" 

//  Register Events 
var gRegisteredEvents = [eventMake, eventDelete, eventClose, eventSelect, eventSet]; //TODO ADD DRAW EVENT

// all callbacks need to be unique so only your panel gets them
// for Photoshop specific add on the id of your extension
csInterface.addEventListener("com.adobe.PhotoshopJSONCallback" + gExtensionID, PSCallbackEvent);
csInterface.addEventListener("com.HCI.ColorMixer.colorsys", ColorSychronizeCallbackEvent);

//  UI items 
// create new layer

var UICreateColor = window.document.getElementById("CreateColor");
var UIBallColor = window.document.getElementById("ballcolor");

var UICanvas = window.document.getElementById("maincanvas");
var UICanvasContext = window.document.getElementById("maincanvas").getContext("2d");
//console.log(UICanvas);
//console.log(UICanvasContext);
var foregroundColor = "FFFFFF";
var backgroundColor;
// Place for Recording 
var RecordedBlob = new Array();     // record the color ball
var ColorPercent = new Array();    // record the percent of each selected ball  within [0,100]
//var usedColor = new Array();       // record used Color
var selectedBlobRec = -1;               // record the index of ball being choosen
var selectedColor = new Color(255);
// Place for parameter
//MARK  may need slighty change it for a bettr effect
var falloff = 50;
var Threshold = 0.6;

function Blob(Color, x, y, radius) {
    this.color = Color;
    this.center = new Point(x, y);
    this.radius = radius;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function padding(num) {
    if (num.length < 2)
        num = '0' + num;
    return num;
}

function Color(init)
{
    this.red = init;
    this.green = init;
    this.blue = init;

    this.ColorToHexString = function () {
        var s = "";
        try {
            s += padding(parseInt(this.red).toString(16));
            s += padding(parseInt(this.green).toString(16));
            s += padding(parseInt(this.blue).toString(16));
        } catch (e) {
            s = e.toString();
        }
        return s;
    }

    this.add = function(newcolor, per) {
        this.red += newcolor.red * per;
        this.green += newcolor.green * per;
        this.blue += newcolor.blue * per;    
    }

    this.divid = function (per) {
        this.red /= per;
        this.green /= per;
        this.blue /= per;
 
    }

}

// ============= Synchronize the color =============
function CreateNewLayer() {
    console.log("Create");
    //
    var activeColor = StringToColor(foregroundColor);
    var newblob = new Blob(activeColor, 20, 20, 10);
    ColorPercent[RecordedBlob.length] = 0;
    RecordedBlob.push(newblob);

    //console.log("foregroundColor" + foregroundColor)
    csInterface.evalScript("addNewColor('" + foregroundColor + "')");//who could tell me why the lack of ' makes such a strange error!!
    redrawCanvas();
}

function StringToColor(str) {
    var activeColor = new Color(0);
    activeColor.red = parseInt(str.substr(0, 2), 16);
    activeColor.green = parseInt(str.substr(2, 2), 16);
    activeColor.blue = parseInt(str.substr(4, 2), 16);
    return activeColor;
}

// ==================================================================
// 界面同步
// ==================================================================


// Synchronize the color 
function ColorSychronizeCallbackEvent(csEvent)
{
    //TODO
    //console.log("ColorSychronizeCallbackEvent");
    console.log(colors);

    var colors = csEvent.data.split(",");
    UICreateColor.style.backgroundColor = '#' + colors[0];
    foregroundColor = String(colors[0]);

    changeBlobColor(colors[1]);

}


// Handle the Event got From PS
function PSCallbackEvent(csEvent) {
    // TODO .. More detailed treatment
    //console.log("PSCallbackEvent");
    try {
        if (typeof csEvent.data === "string") {
            var eventData = csEvent.data.replace("ver1,{", "{");
            var eventDataParse = JSON.parse(eventData);
            var jsonStringBack = JSON.stringify(eventDataParse);
            //JSLogIt("PSCallbackEvent: " + jsonStringBack);  // Output

            // Handle the colorSelect Event
            if (eventDataParse.eventData.source == "colorPickerPanel") {
                csInterface.evalScript("getForegroudColor()");
                //if (eventDataParse.eventData.null._property == "foregroundColor")
                {
                    selectColorInCM = false;
                }
            }

            drawed = true;
            // Synchronize the color
        } else {
            JSLogIt("PhotoshopCallbackUnique expecting string for csEvent.data!");
        }
    } catch (e) {
        JSLogIt("PhotoshopCallbackUnique catch:" + e);
    }
}

// Choose the color 
// TODO the acceleration of Draw
var drawed = false;
function ChangeSelectedColor(x, y) {

    //console.log("ChangeSelectedColor");
    //console.log(ColorPercent);
    s = ""
    for (i = 0; i < ColorPercent.length; i++) {
        s += ColorPercent[i].toString();
        s += ','
    }

    if (drawed) {
        csInterface.evalScript("ChangeSelectedColor('" + s + "')");
        drawed = false;
    }

    var point = new Point(x, y);
    var colortmp = calPercentage(point, true);
    //console.log(colortmp.ColorToHexString())
    selectedColor = colortmp;
    UICreateColor.style.backgroundColor = "#" + colortmp.ColorToHexString();
    csInterface.evalScript("setForegroudColor('" + colortmp.ColorToHexString() + "')");
    redrawCanvas();
}


// ==================================================================
// Canvas 绘制函数
// ==================================================================
function redrawCanvas() {
    //console.log("redrawCanvas");
    height = UICanvas.getAttribute("height");
    width = UICanvas.getAttribute("width");
    //console.log(RecordedBlob.length);

    var data = UICanvasContext.createImageData(width, height);
    for (var x = 0; x < data.width; x++) {
        for (var y = 0; y < data.height; y++) {
            var point = new Point();
            point.x = x;
            point.y = y;
            var getcolor = calPercentage(point, false);
            //console.log(getcolor);

            var index = (y * data.width + x) * 4;  //calculate index
            data.data[index] = getcolor.red;   // red
            data.data[index + 1] = getcolor.green; // green
            data.data[index + 2] = getcolor.blue; // blue
            data.data[index + 3] = 255; // force alpha to 100%
        }
    }
    //set the data back
    UICanvasContext.putImageData(data, 0, 0);
    if (selectColorInCM) {
        var cxt = UICanvasContext;

        //画一个空心圆
        cxt.beginPath();
        cxt.arc(pointx, pointy, 5, 0, Math.PI * 2, false);
        cxt.lineWidth = 2;
        if ((selectedColor.red > 222 && selectedColor.green > 222 && selectedColor.blue > 222)) {
            cxt.strokeStyle = "#111111";
        }
        else { cxt.strokeStyle = "#DDDDDD"; }
        cxt.stroke();//画空心圆
        cxt.closePath();
        //UICanvasContext.arc(pointx, pointy, 30, 0, 2 * Math.PI, true);
    }
}


function distance2(pointA, pointB)
{
    return Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2);
}


function Percentage(pointA, pointB, r) {
    var temp = distance2(pointA, pointB) / Math.pow(r + falloff, 2);
    if (temp > 1) {
        return 0;
    }
    else {
        return 1 - 4 / 9 * Math.pow(temp, 3) + 17 / 9 * Math.pow(temp, 2) - 22 / 9 * temp;
    } 
}


function calPercentage(point, set) {
    var ColorPercentTemp = new Array();
    var i;
    var sum = 0;
    colortmp = new Color(0);

    for (i = 0; i < RecordedBlob.length; i++) {
        ColorPercentTemp[i] = Percentage(point, RecordedBlob[i].center, RecordedBlob[i].radius);
        sum += ColorPercentTemp[i];
        colortmp.add(RecordedBlob[i].color, ColorPercentTemp[i]);
    }
    if (sum < Threshold) {
        var colorred = new Color(255);
        if (set) {
            for (i = 0; i < RecordedBlob.length; i++) {
                ColorPercent[i] = 0;
            }
        }
        return colorred;
    }
    colortmp.divid(sum);
    if (set) {
        // need to change the color for PS blending set
        // 这里由于后面PS的正常的混合方式的要求需要对占比颜色做一点点变化
        var sum_t = 0;
        for (i = 0; i < RecordedBlob.length; i++) {
            if (ColorPercentTemp[i] > 0) {
                sum_t += ColorPercentTemp[i];
                ColorPercent[i] = parseInt(ColorPercentTemp[i] / sum_t * 100);
            }
            else {
                ColorPercent[i] = 0;
            }
        }
    }
    return colortmp;

}

// ==================================================================
// 鼠标以及其他事件
// ==================================================================
var leftmousedown = false;
var middlemousedown = false;
// register events
// Tell Photoshop the events we want to listen for
function Register(inOn, inEvents) {
    // gStartDate = new Date();
    var event;
    if (inOn) {
        event = new CSEvent("com.adobe.PhotoshopRegisterEvent", "APPLICATION");
    } else {
        event = new CSEvent("com.adobe.PhotoshopUnRegisterEvent", "APPLICATION");
    }
    event.extensionId = gExtensionID;
    event.data = inEvents;
    csInterface.dispatchEvent(event);
    //console.log("Register:" + inOn);
}


function changeBlobColor(color) {
    if (selectedBlobRec == -1) {
        return;
    }
    //if (RecordedBlob[selectedBlobRec].color == newcolor)       //If the color does not change
    //    return;

    var newcolor = StringToColor(color);
    var s = selectedBlobRec.toString() + ',' + newcolor.ColorToHexString();
    console.log("ChangeCOLOR"+s);
    csInterface.evalScript("changeLayerColor('" + s + "')");

    RecordedBlob[selectedBlobRec].color = newcolor;

    redrawCanvas();
    selectBlobSetting();
    
}


function selectBlobSetting() {
    if (selectedBlobRec == -1) {
        UIBallColor.style.backgroundColor = "#FFFFFF";
        return;
    }

    var colorstr = RecordedBlob[selectedBlobRec].color.ColorToHexString();
    UIBallColor.style.backgroundColor = "#" + colorstr;
    csInterface.evalScript("setBackgroudColor('" + colorstr + "')");
}


function selectBlob(x, y) {
    // 选择在半径之内的最大的

    var minR = -1;
    selectedBlobRec = -1;
    var point = new Point(x, y);
    for (i = 0; i < RecordedBlob.length; i++) {
        if (Percentage(point, RecordedBlob[i].center, RecordedBlob[i].radius) > Threshold) {
            if (distance2(point, RecordedBlob[i].center) > minR) {
                //console.log("SELECT" + i);
                minR = distance2(point, RecordedBlob[i].center);
                selectedBlobRec = i;
            }
        }
    }
    selectBlobSetting();
}


// For output
function JSLogIt(inMessage) {
    console.log("Log " + inMessage);
    //csInterface.evalScript("LogIt('" + inMessage + "')");
}

var lastx, lasty;
var pointx, pointy;
var selectColorInCM;

function init() {
    // 初始化界面
    themeManager.init();

    try {
        $("#btn_create").click(function () {
            CreateNewLayer();
        });

        var canEvent = $("#maincanvas");
        console.log(canEvent);


        canEvent.mousedown(function (e) {
            //console.log(e);
            if (e.button == 0) //right
            {
                pointx = e.offsetX;
                pointy = e.offsetY;
                selectColorInCM = true;
                ChangeSelectedColor(e.offsetX, e.offsetY);

            }
            if (e.button == 1) //middle
            {
                middlemousedown = true;

            }
            if (e.button == 2) //left
            {
                selectBlob(e.offsetX, e.offsetY);
                lastx = e.offsetX;
                lasty = e.offsetY;
                leftmousedown = true;
            }
        });

        canEvent.mouseup(function (e) {
            //console.log("MOUSEUP");
            //if (e.button == 2) //left
            //{
            leftmousedown = false;
            middlemousedown = false;
            //}
        });

        canEvent.mousemove(function(e) {
            //console.log("MOUSEMOVE");
            //console.log(e);

            if (selectedBlobRec >= 0 && leftmousedown)
            {
                RecordedBlob[selectedBlobRec].center.x += e.offsetX - lastx;
                RecordedBlob[selectedBlobRec].center.y += e.offsetY - lasty
                redrawCanvas();
            }
            if (selectedBlobRec >= 0 && middlemousedown)
            {
                RecordedBlob[selectedBlobRec].radius += (e.offsetX - lastx)/10;
                if (RecordedBlob[selectedBlobRec].radius > 40)
                    RecordedBlob[selectedBlobRec].radius = 40;
                if (RecordedBlob[selectedBlobRec].radius < 5)
                    RecordedBlob[selectedBlobRec].radius = 5;

                redrawCanvas();
            }
            lastx = e.offsetX;
            lasty = e.offsetY;
        });

        canEvent.mouseout(function (e) {

            leftmousedown = false;
            middlemousedown = false;

        });

        Register(true, gRegisteredEvents.toString());
        calPercentage(new Point(0, 0), true);
        csInterface.evalScript("getForegroudColor()");
        redrawCanvas();

    } catch (e) {
        JSLogIt("InitializeCallback catch: " + e);
    }


}

init();

