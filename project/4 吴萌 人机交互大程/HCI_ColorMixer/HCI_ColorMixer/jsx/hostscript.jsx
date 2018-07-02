// Birdy 18.6.12
// some events we are interested in
var eventMake = 1298866208;   // "Mk  "
var eventDelete = 1147958304; // "Dlt "
var eventClose = 1131180832;  // "Cls "
var eventSelect = 1936483188; // "slct" 
var eventSet = 1936028772;    // "setd" 

var worklayer;
var myLayerSets = new Array();
var index = 0;

var colorblack = new SolidColor;
var colorwhite = new SolidColor;

// Init Set for dispatch
try {
    var loadSuccess = new ExternalObject("lib:\PlugPlugExternalObject"); //载入所需对象，loadSuccess 记录是否成功载入
} catch (e) {
    alert(e);// 如果载入失败，输出错误信息
}


function addNewColor(inColor) {
    try {
        // 新建两个图层并塞到数组里
        var layerRef = app.activeDocument.artLayers.add();
        layerRef.name = "ColorMixer";
        var layerRefMask = app.activeDocument.artLayers.add();
        layerRefMask.name = "CM mask";
        myLayerSets[index] = layerRef;
        index++;
        myLayerSets[index] = layerRefMask;
        index++;

        // layerRefMask.blendMode = BlendMode.NORMAL; // auto

        // 移到合适的位置 这里的worklayer就是之前那个workspace
        worklayer.move(layerRef, ElementPlacement.PLACEBEFORE);
        worklayer.move(layerRefMask, ElementPlacement.PLACEBEFORE);
        layerRefMask.grouped = true;//设为剪切蒙版

        app.activeDocument.selection.selectAll;//选择所有颜色

        var colorRef = new SolidColor;
        colorRef.rgb.hexValue = inColor;// 设置颜色
        app.activeDocument.selection.fill(colorRef);

        app.activeDocument.activeLayer = worklayer;// 把激活图层回到Workspcace 免得读完之后位置不对
    } catch (e) {
        alert("addNewColor" + e);
    }
}


// TODO :NO USE
function setAlllayerInvisiable(info) {
    try {
        var i = 0;
        for (i = 0; i < index; i++)
        {
            myLayerSets[i].visible = info;
        }
        app.activeDocument.backgrounLayer = info;
    } catch (e) {
        alert(e);
    }
}


function ChangeSelectedColor(strselectedColor) {

    // alert(index);
    // 先把工作图层的内容合到前几个图层之内
    // 把所有图层被绘制涉及到的部分清空
    // 把其他都设置成不可见 读取工作图层的通道
    //setAlllayerInvisiable(false);
    //app.activeDocument

    try {
        selectedColor = strselectedColor.split(",")
        // change the drawing to black and white then
        var layerBlack = app.activeDocument.artLayers.add();
        app.activeDocument.selection.selectAll;
        app.activeDocument.selection.fill(colorblack);

        var layerWhite = app.activeDocument.artLayers.add();
        app.activeDocument.selection.fill(colorwhite);

        worklayer.move(layerBlack, ElementPlacement.PLACEBEFORE);
        worklayer.move(layerWhite, ElementPlacement.PLACEAFTER);

        layerWhite.grouped = true;

        app.activeDocument.selection.deselect();


        // 选择一个像素块……
        var shapeRef = [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
        ]
        app.activeDocument.selection.select(shapeRef);

        var selection = app.activeDocument.selection;   // initilize
        var channelDraw = app.activeDocument.channels[0];
        selection.load(channelDraw, SelectionType.EXTEND);
        // TODO add check if the layer is empty
        //alert(selection.sold);

        //TODO
        //selection.feather(5);


        layerWhite.remove();
        layerBlack.remove();

        for (i = 0; i < index; i = i + 2) {
            app.activeDocument.activeLayer = myLayerSets[i];
            selection.clear();
        }

        //接着合并到其他的图层里

        var colortemp = colorblack;
        for (i = 0; i < index; i = i + 2) {
            var num = parseInt(selectedColor[Math.floor(i / 2)]);
            app.activeDocument.activeLayer = myLayerSets[i];

            if (num > 0)
                selection.fill(colortemp, ColorBlendMode.NORMAL, num);// black to make it clear
        }



        //清空工作图层
        selection.deselect();
        worklayer.clear();

        app.activeDocument.activeLayer = worklayer;

        //change the forground color

    } catch (e) {
        alert(e);
    }
}


function unwanttedOperation() {
    alert("Warning: Unwanted Treatment Towards The Layer Preserved For ColorMixer May Course ERROR!");
}



function setBackgroudColor(selectedColor) {

    app.backgroundColor.rgb.hexValue = selectedColor;

}


function setForegroudColor(selectedColor) {

    app.foregroundColor.rgb.hexValue = selectedColor;

}

function changeLayerColor(str)
{

    // while form a circle

    try {
        //alert("LAY!");
        var info = str.split(',')
        var colorRef = new SolidColor;
        colorRef.rgb.hexValue = info[1];

        app.activeDocument.selection.selectAll;
        app.activeDocument.activeLayer = myLayerSets[2 * parseInt(info[0]) + 1];
        app.activeDocument.selection.fill(colorRef);

        app.activeDocument.activeLayer = worklayer;
    } catch (e) {
        alert(e);
    }

}

// both for foreground and back
function getForegroudColor() {
    //alert(loadSuccess);
    try {
        if (loadSuccess) {
            var eventJAX = new CSXSEvent();                     //创建事件对象
            eventJAX.type = "com.HCI.ColorMixer.colorsys";      //设定一个类型名称
            eventJAX.data = app.foregroundColor.rgb.hexValue + "," + app.backgroundColor.rgb.hexValue;   // 事件要传递的信息
            eventJAX.dispatch();                                // GO ! 发送事件
            //alert("Already Diapatch")
        }
        else {
            alert("Unable to Synchronize Color")
        }
    } catch (e) {
        alert(e);// 如果载入失败，输出错误信息
    }

    return app.foregroundColor;
}



// =============================================================
// Function For Output

function LogIt(inMessage) {
    try {
        var a = new Logger();
        var b = decodeURIComponent(inMessage);
        //a.log(b + "\n");
        a.showalert(b);
    }
    catch (e) {
        alert("LogIt catch : " + e + ":" + e.line);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Object: Logger
// Usage: Log information to a text file
// Input: String to full path of file to create or append, if no file is given
//        then output file Logger.log is created on the users desktop
// Return: Logger object
// Example:
//
//   var a = new Logger();
//   a.print( 'hello' );
//   a.print( 'hello2\n\n\nHi\n' ) ;
//   a.remove();
//   a.log( Date() );
//   a.print( Date() );
//   a.display();
//
///////////////////////////////////////////////////////////////////////////////

function Logger(inFile) {

    // member properties

    // the file we are currently logging to
    if (undefined == inFile) {
        this.file = new File(Folder.desktop + "/PhotoshopEvents.log");
    } else {
        this.file = new File(inFile);
    }

    // member methods

    // output to the ESTK console
    // note that it behaves a bit differently 
    // when using the BridgeTalk section
    this.print = function (inMessage) {
        if (app.name == "ExtendScript Toolkit") {
            print(inMessage);
        } else {
            var btMessage = new BridgeTalk();
            btMessage.target = "estoolkit";
            btMessage.body = "print(" + inMessage.toSource() + ")";
            btMessage.send();
        }
    }

    // write out a message to the log file
    this.log = function (inMessage) {
        if (this.file.exists) {
            this.file.open('e');
            this.file.seek(0, 2); // end of file
        } else {
            this.file.open('w');
        }
        this.file.write(inMessage);
        this.file.close();
    }

    // show the contents with the execute method
    this.display = function () {
        this.file.execute();
    }

    // remove the file
    this.remove = function () {
        this.file.remove();
    }

    this.showalert = function (inMessage) {
        alert(inMessage);    
    }
}


function init() {
    try {

    worklayer = app.activeDocument.artLayers.add();
    worklayer.name = "CM Workspace";
    //getForegroudColor();


    colorblack.rgb.red = 0;
    colorblack.rgb.green = 0;
    colorblack.rgb.blue = 0;
    colorwhite.rgb.red = 255;
    colorwhite.rgb.green = 255;
    colorwhite.rgb.blue = 255;
    } catch (e) {
        alert(e);// 如果载入失败，输出错误信息
    }

}

init();

// end ps.jsx
