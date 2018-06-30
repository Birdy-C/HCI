        
var worklayer =  app.activeDocument.artLayers.add(); 
var layerBlack = app.activeDocument.artLayers.add();
app.activeDocument.selection.selectAll;
app.activeDocument.selection.fill(colorblack);
        
var layerWhite = app.activeDocument.artLayers.add();
app.activeDocument.selection.fill(colorwhite);

worklayer.move(layerBlack, ElementPlacement.PLACEBEFORE);
worklayer.move(layerWhite, ElementPlacement.PLACEAFTER);

layerWhite.grouped = true;