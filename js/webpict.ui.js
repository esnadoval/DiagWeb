//===== WEB DIAGRAM GRAPH SCRIPT SECTION ===========
//==================================================
//==================================================

//================= VARIABLES GLOBALES=========================


// Retiene  los elementos gráficos que estan en el root del modelo;
var modelElements = new Array();

// Retiene todos los elementos gráficos del modelo. Utilizado para manejar facilmente la interfaz de usuario.
var modelElementsLinear = new Array();

var actualId = 1;
var modelname = "Sin Titulo";
// Arreglo que guarda  los puntos utilizados para redimensionar  un elemento
var selectionHandles = [];

// Hold canvas information

var canvas;
//contexto del canvas
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed
var addflag = false;
var addType = "";
var isDrag = false;
var isResizeDrag = false;
var isLinkBuilt = false;
var expectResize = -1; // Indice del selection handler actual.
var expectResizeForMenu = -1;
var mx, my; // Cordenadas mouse
var linkAttatchDist = 18; //distancia en la cual un extremo del link se pega a su punto de conexión.
// when set to true, the canvas will redraw everything
// invalidate() just sets this to false right now
// we want to call invalidate() whenever we make a change
var canvasValid = false;

// Guarda el elemento seleccionado
var mySel = null;
// Guarda el indice del elemento seleccionado en modelElementsLinear
var mySelIdx = -1;

// Variables de seleccion (cuando se selecciona una figura)
var mySelColor = '#CC0000';
var containmentColor = '#585858';
var mySelWidth = 2;
var mySelBoxColor = 'darkred'; // New for selection boxes
var mySelBoxSize = 6;

// Canvas fantasma (para verificar que se selecciona)
var ghostcanvas;
//contexto del canvas fantasma
var gctx;


var offsetx, offsety;
var linx, liny;
var npx, npy;
// Constantes para editar el marco (para evitar un bug en el cual, al interactuar con el canvas, este se selecciona)
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
var descriptorString;
var descriptorLoad = false;
var htmlPalette;

function drawSVG(context, src, x, y, w, h) {


//var DOMURL = self.URL || self.webkitURL || self;
    //var img = new Image();

//var url = DOMURL.createObjectURL(src);
    //var ld = false;
    //img.onload = function() {
    context.fillStyle = this.fill;
    context.drawImage(src, x, y, w, h);

    //};
    //img.src = src;


}
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//==========FIGURAS PINTABLES CORE======================
//======================================================

//================= BOX 2 =========================
function Box2() {
    this.id = 0;
    this.parent = {};
    this.valid = true;
    this.validmessage = "Ok";
    this.x = 0;
    this.y = 0;
    this.w = 1; // default width and height?
    this.h = 1;
    this.wResizePolice = "sw";
    this.hResizePolice = "sh";
    this.xMovePolice = "sx";
    this.yMovePolice = "sy";
    this.resizeflag = 0;
    this.element = {};
    this.deltaPoints = new Array();
    this.moveablePoints = new Array();
    this.deltax = 0;
    this.deltay = 0;
    this.fill = '#444444';
    this.setFill = function(textid) {
        this.fill = $("#" + textid).val();
    }
    this.atspots = [];
    this.childsElements = [];
    this.xmiString = function() {
        var str = "<" + getXMIRelationName(this.element.nombre) + " id=\"" + this.id + "\" ";
        var missAtr = new Array();
        var rels = new Array();
        var ids = new Array();
        for (var i = 0; i < this.childsElements.length; i++) {
            if (this.childsElements[i] instanceof TextBox) {
                for (var j = 0; j < this.childsElements[i].words.length; j++) {
                    str += " " + this.childsElements[i].words[j].title.nombre + "=\"" + this.childsElements[i].words[j].text + "\"";
                    missAtr.push(this.childsElements[i].words[j].title.nombre);
                }
            } else if (this.childsElements[i] instanceof Box2) {
                var encontro = false;
                var relatname = buscarRelacion(this.element, this.childsElements[i].element);
                for (var k = 0; k < rels.length && !encontro; k++) {
                    if (rels[k] == relatname.nombre) {
                        encontro = true;
                        ids[k] += " " + this.childsElements[i].id;
                    }
                }
                if (!encontro) {
                    rels.push(relatname.nombre);
                    ids.push("" + this.childsElements[i].id);
                }

            }
            else if (this.childsElements[i] instanceof FlowBox) {
                var itms = this.childsElements[i].childsElements;
                for (var o = 0; o < itms.length; o++) {
                    var encontro = false;
                    var relatname = buscarRelacion(this.element, itms[o].element);
                    for (var k = 0; k < rels.length && !encontro; k++) {
                        if (rels[k] == relatname.nombre) {
                            encontro = true;
                            ids[k] += " " + itms[o].id;
                        }
                    }
                    if (!encontro) {
                        rels.push(relatname.nombre);
                        ids.push("" + itms[o].id);
                    }
                }
            }
        }

        for (var i = 0; i < this.element.atributos.length; i++) {
            var enc = false;
            for (var j = 0; j < missAtr.length && !enc; j++) {
                if (this.element.atributos[i].nombre == missAtr[j] || this.element.atributos[i].nombre == "id") {
                    enc = true;
                }
            }
            if (!enc) {
                str += " " + this.element.atributos[i].nombre + "=\"\"";
            }
        }

        for (var i = 0; i < rels.length; i++) {
            str += " " + rels[i] + "=\"" + ids[i] + "\"";
        }
        str += "/>";
        return str;
    }
    this.buildPropBoard = function() {
        var prptxt = 0;
        var propstr = "<table style=\"width: 100%; height: 100%;\" border=\"1px\" cellspacing=\"0px\"><tr><td><b>Atributos de la Instancia.</b><td> <b>Valor</b></td></tr>";
        for (var i = 0; i < this.childsElements.length; i++) {
            if (this.childsElements[i] instanceof TextBox) {
                for (var j = 0; j < this.childsElements[i].words.length; j++) {
                    propstr += " <tr><td><label for=\"pr" + prptxt + "\">" + this.childsElements[i].words[j].title + "</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.childsElements[i].words[j].text + "\" type=\"text\" onKeyPress=\"mySel.childsElements[" + i + "].words[" + j + "].setText('pr" + prptxt + "');\"/></td></tr>";
                    prptxt++;
                }
            }
        }

        propstr += "<tr><td><b>Propiedades Visuales.</b><td> <b>Valor</b></td></tr>";
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Color de letra</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.fill + "\" type=\"text\" onKeyPress=\"mySel.setFill('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;
        var imgstr = "";
        if (this.img != null) {
            imgstr = this.img.src;
        }
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Imagen de fondo</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + imgstr + "\" type=\"text\" onKeyPress=\"mySel.setImg('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;

        propstr += "</table>";
        refreshPropBoard(propstr, "Box2 " + this.id);
    }
    this.findConnectionPoint = function(pointt) {
        for (var i = 0; i < this.atspots.length; i++) {
            if (this.atspots[i].x == pointt.x && this.atspots[i].y == pointt.y) {
                return this.atspots[i];
            }
        }
        return pointt;
    }

    this.persistString = function() {
        var imgstr = "";
        if (this.img != null) {
            imgstr = this.img.src;
        }
        var str = "<shape type=\"box2\" id=\"" + this.id + "\" img=\"" + imgstr + "\" parent=\"" + this.parent.id + "\" x=\"" + this.x + "\" y=\"" + this.y + "\" w=\"" + this.w + "\" h=\"" + this.h + "\" wrpolice=\"" + this.wResizePolice + "\" hrpolice=\"" + this.hResizePolice + "\" xmpolice=\"" + this.xMovePolice + "\"  ympolice=\"" + this.yMovePolice + "\" resizeFlg=\"" + this.resizeflag + "\" element=\"" + this.element.nombre + "\" fill=\"" + this.fill + "\"> ";

        str += "<childsElements> ";
        for (var i = 0; i < this.childsElements.length; i++) {
            str += this.childsElements[i].persistString() + " ";
        }
        str += "</childsElements> </shape>";
        return str;
    }
    this.toObject = function(xmlSegment, parent) {

        var rect = new Box2;

        rect.parent = parent;



        rect.x = textualCalculator(rect, xmlSegment.attributes.getNamedItem("x").value);
        rect.y = textualCalculator(rect, xmlSegment.attributes.getNamedItem("y").value);
        rect.w = textualCalculator(rect, xmlSegment.attributes.getNamedItem("w").value);
        rect.h = textualCalculator(rect, xmlSegment.attributes.getNamedItem("h").value);

        if (!descriptorLoad) {
            rect.id = parseInt(xmlSegment.attributes.getNamedItem("id").value);
        } else {
            rect.id = actualId;
            actualId++;
        }


        rect.element = buscarClase(xmlSegment.attributes.getNamedItem("element").value);
        rect.resizeflag = parseInt(xmlSegment.attributes.getNamedItem("resizeFlg").value);

        rect.wResizePolice = xmlSegment.attributes.getNamedItem("wrpolice").value;

        rect.hResizePolice = xmlSegment.attributes.getNamedItem("hrpolice").value;
        rect.xMovePolice = xmlSegment.attributes.getNamedItem("xmpolice").value;
        rect.yMovePolice = xmlSegment.attributes.getNamedItem("ympolice").value;
        rect.fill = xmlSegment.attributes.getNamedItem("fill").value;

        var imgl = new Image();

        imgl.onload = function() {
            rect.img = imgl;

        };
        imgl.src = xmlSegment.attributes.getNamedItem("img").value;


        rect.atspots = new Array();
        rect.atspots[0] = new point(rect.x, rect.y);

        rect.atspots[1] = new point(rect.x + rect.w, rect.y);


        rect.atspots[2] = new point(rect.x + rect.w / 2, rect.y);


        //middle left
        rect.atspots[3] = new point(rect.x, rect.y + rect.h / 2);


        //middle right
        rect.atspots[4] = new point(rect.x + rect.w, rect.y + rect.h / 2);


        //bottom left, middle, right
        rect.atspots[6] = new point(rect.x + rect.w / 2, rect.y + rect.h);
        rect.atspots[5] = new point(rect.x, rect.y + rect.h);


        rect.atspots[7] = new point(rect.x + rect.w, rect.y + rect.h);

        rect.atspots[0].relation = this;
        rect.atspots[1].relation = this;
        rect.atspots[2].relation = this;
        //middle left
        rect.atspots[3].relation = this;
        //middle right
        rect.atspots[4].relation = this;
        //bottom left, middle, right
        rect.atspots[6].relation = this;
        rect.atspots[5].relation = this;
        rect.atspots[7].relation = this;


        var ch = xmlSegment.childNodes;
        for (var f = 0; f < ch.length; f++) {
            if (ch[f].nodeName == "childsElements") {
                var chld = ch[f].childNodes;
                //console.log("L->" + chld.nodeName);
                for (var i = 0; i < chld.length; i++) {
                    //console.log("T->" + chld[i].nodeName);
                    if (chld[i].nodeName == "shape") {
                        if (chld[i].attributes.getNamedItem("type").value == "box2") {
                            rect.childsElements.push(new Box2().toObject(chld[i], rect));
                        } else if (chld[i].attributes.getNamedItem("type").value == "link") {
                            rect.childsElements.push(new Link().toObject(chld[i], rect));
                        } else if (chld[i].attributes.getNamedItem("type").value == "flowbox") {
                            rect.childsElements.push(new FlowBox().toObject(chld[i], rect));

                        } else if (chld[i].attributes.getNamedItem("type").value == "textbox") {
                            rect.childsElements.push(new TextBox().toObject(chld[i], rect));
                        }
                    }
                }
            }
        }

        //console.log(rect.persistString());

        return rect;
    }
    this.moveAct = function(mx, my) {
        this.movePoints(mx, my);
        this.x = mx - this.deltax;
        this.y = my - this.deltay;
        verifyContainmentOnModel();
        for (var i = 0; i < this.childsElements.length; i++) {
            this.childsElements[i].moveAct(mx, my);
        }
    }
    this.movePoints = function(mx, my) {
        for (var i = 0; i < this.moveablePoints.length; i++) {
            this.moveablePoints[i].x = mx - this.deltaPoints[i].x;
            this.moveablePoints[i].y = my - this.deltaPoints[i].y;
        }
    }
    this.move = function() {
        if (this.resizeflag == 3) {
            this.x = textualCalculator(this, this.xMovePolice);
            this.y = textualCalculator(this, this.yMovePolice);
        }
    }
    this.resize = function() {
        if (this.resizeflag == 3) {
            this.w = textualCalculator(this, this.wResizePolice);
            this.h = textualCalculator(this, this.hResizePolice);
        }
    }
    this.calculateMoveablePoints = function(mx, my) {
        this.deltaPoints = new Array();
        this.moveablePoints = new Array();
        for (var i = 0; i < modelElementsLinear.length; i++) {
            if (modelElementsLinear[i] instanceof Link) {
                for (var j = 0; j < modelElementsLinear[i].bendPoints.length; j++) {
                    if (this.isInArea(modelElementsLinear[i].bendPoints[j])) {

                        var elemp = modelElementsLinear[i].bendPoints[j];

                        var x = mx - elemp.x;
                        var y = my - elemp.y;
                        var np = new point(x, y);
                        this.deltaPoints.push(np);
                        this.moveablePoints.push(elemp);

                    }
                }
            }
        }
    }
    this.calculateMove = function(mx, my) {
        this.calculateMoveablePoints(mx, my);
        this.deltax = mx - this.x;
        this.deltay = my - this.y;
        this.x = mx - this.deltax;
        this.y = my - this.deltay;
        for (var i = 0; i < this.childsElements.length; i++) {
            this.childsElements[i].calculateMove(mx, my);
        }
    }
    this.addElement = function(elem) {
        var found = false;
        for (var i = 0; i < this.childsElements.length && !found; i++) {
            if (this.childsElements[i] instanceof Box2) {
                if (this.childsElements[i].isInArea(elem)) {
                    this.childsElements[i].addElement(elem);
                    found = true;
                }
            }
        }
        if (found == false) {
            this.childsElements.push(elem);
            elem.parent = this;
        }

    }
    this.isInArea = function(elem) {
        if (elem instanceof Box2) {

            if (((elem.x > this.x && elem.x < (this.x + this.w)) && (elem.y > this.y && elem.y < (this.y + this.h))) &&
                    ((elem.x + elem.w > this.x && elem.x + elem.w < (this.x + this.w)) && (elem.y + elem.h > this.y && elem.y + elem.h < (this.y + this.h)))) {
                return true;
            }
        } else if (!(elem instanceof Link)) {
            if ((elem.x > this.x && elem.x < (this.x + this.w)) && (elem.y > this.y && elem.y < (this.y + this.h))) {
                return true;
            }
        }
        return false;
    }
    this.drawChilds = function() {
        for (var i = 0; i < this.childsElements.length; i++) {
            //if (this.isInArea(this.childsElements[i]) || this.childsElements[i] == mySel) {
            this.childsElements[i].draw(ctx);
            //}
            if (this.childsElements[i] instanceof Box2) {

                this.childsElements[i].drawChilds();

            }
        }
    }
    this.deleteElement = function(elem) {

        for (var i = 0; i < this.childsElements.length; i++) {
            if (this.childsElements[i] instanceof Box2) {
                if (elem == this.childsElements[i]) {
                    this.childsElements.splice(i, 1);
                } else {
                    this.childsElements[i].deleteElement(elem);
                }
            } else {
                if (elem == this.childsElements[i]) {
                    this.childsElements.splice(i, 1);
                }
            }
        }
    }
    this.rebuildLinear = function() {

        for (var i = 0; i < this.childsElements.length; i++) {
            modelElementsLinear.push(this.childsElements[i]);
            if (this.childsElements[i] instanceof Box2 || this.childsElements[i] instanceof FlowBox) {
                this.childsElements[i].rebuildLinear();
            }
        }
    }
    this.isNearPoint = function(x, y) {


        for (var i = 0; i < this.atspots.length; i++) {
            if (Math.abs(x - this.atspots[i].x) <= linkAttatchDist && Math.abs(y - this.atspots[i].y) <= linkAttatchDist) {

                return this.atspots[i];



            }
        }


        return new point(x, y);
    }
    this.img = "";
    this.setImg = function(textid) {
        var imgl = new Image();

        imgl.onload = function() {
            this.img = imgl;

        };
        imgl.src = $("#" + textid).val();

    }
}




Box2.prototype = {
    draw: function(context, optionalColor) {

        if (context === gctx) {
            context.fillStyle = 'black';
            context.fillRect(this.x, this.y, this.w, this.h); // always want black for the ghost canvas
        } else {
            //var e = new Image();
            //e.src = this.img;
            //context.fillStyle = this.fill;
            //context.drawImage(e, this.x, this.y, this.w, this.h);
            drawSVG(context, this.img, this.x, this.y, this.w, this.h);

        }


        var validatelist = validateRelMultiplicity(this);
        if (validatelist != null) {
            var e = new Image();
            e.src = "./img/alert.png";
            context.fillStyle = this.fill;
            context.drawImage(e, this.x + 3, this.y + 3, 15, 15);
            this.valid = false;
            var str = validatelist[0].refA.nombre + "(" + validatelist[0].minimos + "-" + validatelist[0].maximos + ")";
            for (var i = 1; i < validatelist.length; i++) {
                str += ("," + validatelist[i].refA.nombre + "(" + validatelist[i].minimos + "-" + validatelist[i].maximos + ")");
            }
            this.validmessage = "<img src=\"./img/alert.png\" width=\"12px\" height=\"12px\"/><font color=\"red\" > - Instancia de<b> " + this.element.nombre + "(" + this.id + ")</b>:  Error de multiplicidad: No hay Suficientes, o se sobrepasa la cantidad de los siguientes elementos: <b>" + str + "</b></font>";

        } else {
            this.valid = true;
        }



        this.atspots[0].relation = this;
        this.atspots[0].x = this.x;
        this.atspots[0].y = this.y;

        this.atspots[1].relation = this;
        this.atspots[1].x = this.x + this.w;
        this.atspots[1].y = this.y;

        this.atspots[2].relation = this;
        this.atspots[2].x = this.x + this.w / 2;
        this.atspots[2].y = this.y;



        //middle left
        this.atspots[3].relation = this;
        this.atspots[3].x = this.x;
        this.atspots[3].y = this.y + this.h / 2;


        //middle right
        this.atspots[4].relation = this;
        this.atspots[4].x = this.x + this.w;
        this.atspots[4].y = this.y + this.h / 2;


        //bottom left, middle, right
        this.atspots[6].relation = this;
        this.atspots[6].x = this.x + this.w / 2;
        this.atspots[6].y = this.y + this.h;

        this.atspots[5].relation = this;
        this.atspots[5].x = this.x;
        this.atspots[5].y = this.y + this.h;

        this.atspots[7].relation = this;
        this.atspots[7].x = this.x + this.w;
        this.atspots[7].y = this.y + this.h;

        // draw selection

        //http://www.brianmokeefe.com/html5_graph
        // this is a stroke along the box and also 8 new selection handles
        if (isLinkBuilt) {
            if (validateRelation(mySel, this) != null) {
                var startPoint = (Math.PI / 180) * 0;
                var endPoint = (Math.PI / 180) * 360;
                for (var i = 0; i < this.atspots.length; i++) {
                    context.strokeStyle = mySelColor;
                    context.lineWidth = mySelWidth;
                    context.beginPath();
                    context.arc(this.atspots[i].x, this.atspots[i].y, linkAttatchDist, startPoint, endPoint, true);
                    context.stroke();
                    context.closePath();
                }
            }
        }

        if ((isDrag == true || isResizeDrag == true) && mySel != this && this.isInArea(mySel) && !(mySel instanceof Link) && !(mySel instanceof TextBox) && !(mySel instanceof FlowBox)) {

            var found = false;
            for (var i = 0; i < this.childsElements.length && !found; i++) {
                if (this.childsElements[i] instanceof Box2) {
                    if (this.childsElements[i].isInArea(mySel)) {

                        found = true;
                    }
                }
            }
            if (found == false && (validateRelation(this, mySel) != null)) {

                context.strokeStyle = mySelColor;
                context.lineWidth = mySelWidth;
                context.strokeRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10);
                deleteElement(mySel);
                addElement(mySel);
                rebuildLinear();
            }
        }
        else if ((isDrag == true || isResizeDrag == true) && mySel.parent instanceof Box2 && mySel != this && !(mySel instanceof Link)) {
            if (this.isInArea(mySel.parent)) {
                var found = false;
                for (var i = 0; i < this.childsElements.length && !found; i++) {
                    if (this.childsElements[i] instanceof Box2) {
                        if (this.childsElements[i].isInArea(mySel.parent)) {

                            found = true;
                        }
                    }
                }
                if (found == false && (validateRelation(this, mySel.parent) != null)) {

                    context.strokeStyle = mySelColor;
                    context.lineWidth = mySelWidth;
                    context.strokeRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10);
                    deleteElement(mySel.parent);
                    addElement(mySel.parent);
                    rebuildLinear();
                }
            }
        } else if ((isDrag == true || isResizeDrag == true) && mySel.parent instanceof FlowBox && mySel != this && !(mySel instanceof Link)) {
            if (this.isInArea(mySel.parent)) {
                var found = false;
                for (var i = 0; i < this.childsElements.length && !found; i++) {
                    if (this.childsElements[i] instanceof Box2) {
                        if (this.childsElements[i].isInArea(mySel.parent.parent)) {

                            found = true;
                        }
                    }
                }
                if (found == false && (validateRelation(this, mySel.parent.parent) != null)) {

                    context.strokeStyle = mySelColor;
                    context.lineWidth = mySelWidth;
                    context.strokeRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10);
                    deleteElement(mySel.parent.parent);
                    addElement(mySel.parent.parent);
                    rebuildLinear();
                }
            }
        }


        if (mySel === this) {
            context.strokeStyle = mySelColor;
            context.lineWidth = mySelWidth;
            context.strokeRect(this.x, this.y, this.w, this.h);

            // draw the boxes

            var half = mySelBoxSize / 2;

            // 0  1  2
            // 3     4
            // 5  6  7
            if (this.resizeflag != 3) {
                // top left, middle, right
                selectionHandles[0].x = this.x - half;
                selectionHandles[0].y = this.y - half;

                selectionHandles[1].x = this.x + this.w / 2 - half;
                selectionHandles[1].y = this.y - half;

                selectionHandles[2].x = this.x + this.w - half;
                selectionHandles[2].y = this.y - half;

                //middle left
                selectionHandles[3].x = this.x - half;
                selectionHandles[3].y = this.y + this.h / 2 - half;

                //middle right
                selectionHandles[4].x = this.x + this.w - half;
                selectionHandles[4].y = this.y + this.h / 2 - half;

                //bottom left, middle, right
                selectionHandles[6].x = this.x + this.w / 2 - half;
                selectionHandles[6].y = this.y + this.h - half;

                selectionHandles[5].x = this.x - half;
                selectionHandles[5].y = this.y + this.h - half;

                selectionHandles[7].x = this.x + this.w - half;
                selectionHandles[7].y = this.y + this.h - half;


                context.fillStyle = mySelBoxColor;
                for (var i = 0; i < 8; i++) {
                    var cur = selectionHandles[i];
                    context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
                }
            }
        }
        context.strokeStyle = '#000000';
    } // end draw

}

//===================================================
//================= LINK =========================
function relContainer() {
    this.rellst = [];
    this.persistString = function() {
        var perstr = "";
        for (var i = 0; i < this.rellst.length; i++) {
            perstr += (i == 0 ? "" : ",") + this.rellst[i].nombre;
        }
        return perstr;
    };

    this.toObject = function(relString) {
        var rels = relString.split(",");
        this.rellst = new Array();
        for (var i = 0; i < rels.length; i++) {
            this.rellst.push(buscarRelacionId(rels[i]));
        }
    };
    this.isInListOfRels = function(refAname) {
        for (var i = 0; i < this.rellst.length; i++) {
            //console.log("//"+refAname+" -- "+this.rellst[i].refA.nombre );
            if (refAname == this.rellst[i].refA.nombre) {

                return this.rellst[i];
            }
        }
        //console.log("--> loc");
        return null;
    };
    this.refAstr = function() {


    };
}
function refAstr(list) {
    var perstr = "";
    for (var i = 0; i < this.list.length; i++) {
        perstr = perstr + (i == 0 ? "" : ",") + this.list[i].refA.nombre;
    }
    return perstr.toString();
}
function Link() {
    this.id = 0;
    this.valid = true;
    this.validmessage = "Ok";
    this.p1 = {};
    this.p1rel = {};
    this.p2 = {};
    this.p2rel = {};
    this.dash = false;
    this.setDash = function(textid) {
        this.dash = $("#" + textid).val() === "false" ? false : true;
    }
    this.fill = '#444444';
    this.bendPoints = new Array();
    this.w = 3;
    this.setW = function(textid) {
        this.w = parseInt($("#" + textid).val());
    }
    this.arrowStyle = 0;
    this.setArrowStyle = function(textid) {
        this.arrowStyle = parseInt($("#" + textid).val());
    }
    this.arrowSize = 8;
    this.setArrowSize = function(textid) {
        this.arrowSize = parseInt($("#" + textid).val());
    }
    this.arrowColor = 'white';
    this.setArrowColor = function(textid) {
        this.arrowColor = $("#" + textid).val();
    }
    this.element = {};
    this.xmiString = function() {
        var ids = new Array();
        var rels = new Array();
        var encontro = false;
        var pt1 = buscarRelacion(this.element, this.p1.relation.element);


        rels.push(pt1.nombre);
        ids.push("" + this.p1.relation.id);


        var pt2 = buscarRelacion(this.element, this.p2.relation.element);
        for (var k = 0; k < rels.length && !encontro; k++) {
            if (rels[k] == pt2.nombre) {
                encontro = true;
                ids[k] += " " + this.p2.relation.id;
            }
        }
        if (!encontro) {
            rels.push(pt2.nombre);
            ids.push("" + this.p2.relation.id);
        }

        var str = "<" + getXMIRelationName(this.element.nombre) + " id=\"" + this.id + "\"";
        for (var i = 0; i < rels.length; i++) {
            str += " " + rels[i] + "=\"" + ids[i] + "\"";
        }
        for (var i = 0; i < this.element.atributos.length; i++) {

            if (this.element.atributos[i].nombre != "id") {
                str += " " + this.element.atributos[i].nombre + "=\"\"";
            }
        }
        str += "/>";
        return str;
    }
    this.buildPropBoard = function() {
        var prptxt = 0;
        var propstr = "<table style=\"width: 100%; height: 100%;\" border=\"1px\" cellspacing=\"0px\"><tr><td><b>Propiedades Visuales.</b><td> <b>Valor</b></td></tr>";
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Punteo</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.dash + "\" type=\"text\" onKeyPress=\"mySel.setDash('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;

        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Ancho de Linea</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.w + "\" type=\"text\" onKeyPress=\"mySel.setW('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Tipo de Flecha</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.arrowStyle + "\" type=\"text\" onKeyPress=\"mySel.setArrowStyle('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Tama�o de Flecha</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.arrowSize + "\" type=\"text\" onKeyPress=\"mySel.setArrowSize('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Color de Flecha</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.arrowColor + "\" type=\"text\" onKeyPress=\"mySel.setArrowColor('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;

        propstr += "</table>";
        refreshPropBoard(propstr, "Link " + this.id);
    }
    this.persistString = function() {

        var str = "<shape type=\"link\" id=\"" + this.id + "\" p1rel=\"" + this.p1rel.persistString() + "\" p2rel=\"" + this.p2rel.persistString() + "\" dash=\"" + this.dash + "\" fill=\"" + this.fill + "\" w=\"" + this.w + "\" arrowStyle=\"" + this.arrowStyle + "\" arrowSize=\"" + this.arrowSize + "\" arrowColor=\"" + this.arrowColor + "\" element=\"" + this.element.nombre + "\"> ";
        str += "<pone>" + this.p1.persistString() + "</pone><ptwo>" + this.p2.persistString() + "</ptwo><bendpoints> ";
        for (var i = 0; i < this.bendPoints.length; i++) {
            str += this.bendPoints[i].persistString() + " ";
        }
        str += "</bendpoints>";

        str += "</shape>";
        return str;
    }
    this.toObject = function(xmlSegment, parent) {

        var rect = new Link;
        var rels1 = new relContainer();
        var rels2 = new relContainer();
        rels1.toObject(xmlSegment.attributes.getNamedItem("p1rel").value);
        rels2.toObject(xmlSegment.attributes.getNamedItem("p2rel").value);
        rect.p1rel = rels1;
        //console.log(rels1.persistString());
        rect.p2rel = rels2;
        rect.dash = xmlSegment.attributes.getNamedItem("dash").value === "false" ? false : true;
        rect.fill = xmlSegment.attributes.getNamedItem("fill").value;
        rect.w = parseFloat(xmlSegment.attributes.getNamedItem("w").value);
        rect.arrowStyle = parseInt(xmlSegment.attributes.getNamedItem("arrowStyle").value);
        rect.arrowSize = parseInt(xmlSegment.attributes.getNamedItem("arrowSize").value);
        rect.arrowColor = xmlSegment.attributes.getNamedItem("arrowColor").value;


        if (!descriptorLoad) {
            rect.id = parseInt(xmlSegment.attributes.getNamedItem("id").value);
        } else {
            rect.id = actualId;
            actualId++;
        }
        rect.element = buscarClase(xmlSegment.attributes.getNamedItem("element").value);





        rect.bendPoints = new Array();

        var ch = xmlSegment.childNodes;

        for (var i = 0; i < ch.length; i++) {
            //console.log("TLF->" + ch[i].nodeName);
            if (ch[i].nodeName == "pone") {
                //console.log("p1");

                var chld2 = ch[i].childNodes;

                for (var ij = 0; ij < chld2.length; ij++) {

                    if (chld2[ij].nodeName == "point") {
                        rect.p1 = new point(0, 0).toObject(chld2[ij], rect);
                        if (rect.p1.relation != null) {
                            rect.p1 = rect.p1.relation.findConnectionPoint(rect.p1);
                        }
                    }
                }





            } else if (ch[i].nodeName == "ptwo") {
                var chld3 = ch[i].childNodes;
                //console.log("p2");

                for (var ik = 0; ik < chld3.length; ik++) {

                    if (chld2[ik].nodeName == "point") {
                        rect.p2 = new point(0, 0).toObject(chld3[ik], rect);
                        if (rect.p2.relation != null) {

                            rect.p2 = rect.p2.relation.findConnectionPoint(rect.p2);
                        }
                    }
                }



            } else if (ch[i].nodeName == "bendpoints") {
                var chld = ch[i].childNodes;

                for (var ix = 0; ix < chld.length; ix++) {
                    //console.log("TLFD->" + chld[ix].nodeName);


                    if (chld[ix].nodeName == "point") {
                        //console.log("E2");
                        rect.bendPoints.push(new point(0, 0).toObject(chld[ix], rect));
                    }
                }

            }
        }






        //console.log("s-->" + rect.persistString());






        return rect;
    }
    this.moveAct = function(mx, my) {
    }
    this.calculateMove = function(mx, my) {
    }
    this.addBendPoint = function(point) {
        if (this.bendPoints.length < 6) {
            if (this.bendPoints.length > 0) {
                if (isBetween(this.p1, this.bendPoints[0], point, this.w)) {
                    this.bendPoints.splice(0, 0, point);
                    return;
                }
                if (this.bendPoints.length >= 2) {
                    for (var i = 0; i < this.bendPoints.length - 1; i++) {
                        if (isBetween(this.bendPoints[i], this.bendPoints[i + 1], point, this.w)) {
                            this.bendPoints.splice(i + 1, 0, point);
                            return;
                        }
                    }
                }
                if (isBetween(this.bendPoints[this.bendPoints.length - 1], this.p2, point, this.w)) {
                    //this.bendPoints.splice(this.bendPoints.length - 1, 0, point);
                    this.bendPoints[this.bendPoints.length] = point;
                    return;
                }

            } else {
                this.bendPoints.push(point);
            }
        }
    }
    this.delBendPoint = function(idx) {

        this.bendPoints.splice(idx, 1);
    }
    this.arrowHead = function(ctx, toPoint, fromPoint, arrowsize, color) {


        var dx = toPoint.x - fromPoint.x;
        var dy = toPoint.y - fromPoint.y;

        // normalize
        var length = Math.sqrt(dx * dx + dy * dy);
        var unitDx = dx / length;
        var unitDy = dy / length;
        // increase this to get a larger arrow head
        var arrowHeadSize = arrowsize;

        var arrowPoint1 = new point(
                (toPoint.x - unitDx * arrowHeadSize - unitDy * arrowHeadSize),
                (toPoint.y - unitDy * arrowHeadSize + unitDx * arrowHeadSize));
        var arrowPoint2 = new point(
                (toPoint.x - unitDx * arrowHeadSize + unitDy * arrowHeadSize),
                (toPoint.y - unitDy * arrowHeadSize - unitDx * arrowHeadSize));

        if (color == 'no') {
            ctx.beginPath();
            ctx.moveTo(arrowPoint1.x, arrowPoint1.y);
            ctx.lineTo(toPoint.x, toPoint.y);
            ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
        } else {
            ctx.beginPath();
            ctx.moveTo(toPoint.x, toPoint.y);
            ctx.lineTo(arrowPoint1.x, arrowPoint1.y);
            ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
            ctx.lineTo(toPoint.x, toPoint.y);
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.lineWidth = this.w;
        ctx.stroke();
    }
    this.errorImg = function(ctx, toPoint, fromPoint, imgurl) {

        /*
         var dx = toPoint.x - fromPoint.x;
         var dy = toPoint.y - fromPoint.y;
         
         // normalize
         var length = Math.sqrt(dx * dx + dy * dy);
         var unitDx = dx / length;
         var unitDy = dy / length;
         // increase this to get a larger arrow head
         var arrowHeadSize = this.arrowSize + 5;
         
         var arrowPoint1 = new point(
         (toPoint.x - unitDx * arrowHeadSize - unitDy * arrowHeadSize),
         (toPoint.y - unitDy * arrowHeadSize + unitDx * arrowHeadSize));
         var arrowPoint2 = new point(
         (toPoint.x - unitDx * arrowHeadSize + unitDy * arrowHeadSize),
         (toPoint.y - unitDy * arrowHeadSize - unitDx * arrowHeadSize));
         */
        var e = new Image();
        e.src = imgurl;
        ctx.fillStyle = this.fill;
        ctx.drawImage(e, (fromPoint.x) - (15 / 2), fromPoint.y + this.arrowSize + 5, 15, 15);
    }

}

//===================================================
//================= CLASE PUNTO =========================
function point(x, y) {
    this.relation = null;
    this.x = x;
    this.y = y;
    this.persistString = function() {
        var str = "<point x=\"" + this.x + "\" y=\"" + this.y + "\"> ";
        if (this.relation != null) {
            str += "<relation name=\"" + this.relation.id + "\"></relation> ";
        }
        str += "</point>";
        return str;
    }

    this.toObject = function(xmlSegment, parent) {

        var rect = new point(0, 0);

        rect.x = textualCalculator(rect, xmlSegment.attributes.getNamedItem("x").value);
        rect.y = textualCalculator(rect, xmlSegment.attributes.getNamedItem("y").value);



        var chld = xmlSegment.childNodes;

        for (var i = 0; i < chld.length; i++) {
            if (chld[i].nodeName === "relation") {
                rect.relation = buscarInstanciaPorId(parseInt(chld[i].attributes.getNamedItem("name").value));
            }
        }



        return rect;
    }

}
Link.prototype = {
    // we used to have a solo draw function
    // but now each box is responsible for its own drawing
    // mainDraw() will call this with the normal canvas
    // myDown will call this with the ghost canvas with 'black'
    draw: function(context, optionalColor) {
        if (context == gctx) {
            context.fillStyle = 'black';
            context.strokeStyle = 'black';

        } else {
            context.strokeStyle = this.fill;
            context.fillStyle = this.fill;

        }


        if (this.dash) {



            var lastpt = this.p1;

            for (var i = 0; i < this.bendPoints.length; i++) {

                dashlin(context, lastpt.x, lastpt.y, this.bendPoints[i].x, this.bendPoints[i].y, this.w);
                lastpt = this.bendPoints[i];

            }
            dashlin(context, lastpt.x, lastpt.y, this.p2.x, this.p2.y, this.w);


        } else {



            context.beginPath();
            context.moveTo(this.p1.x, this.p1.y);

            for (var i = 0; i < this.bendPoints.length; i++) {
                context.lineTo(this.bendPoints[i].x, this.bendPoints[i].y);
            }
            context.lineTo(this.p2.x, this.p2.y);

            context.lineWidth = this.w;

            context.stroke();
            context.closePath();
        }

        if (context != gctx) {
            if (this.p1.relation == null && this.p2.relation == null && !isElementInLinear(this.p1.relation) && !isElementInLinear(this.p2.relation)) {
                this.errorImg(context, this.p1, this.p1, "./img/alert.png");
                this.errorImg(context, this.p2, this.p2, "./img/alert.png");
                this.validmessage = "<img src=\"./img/alert.png\" width=\"12px\" height=\"12px\"/><font color=\"red\" > - Instancia de<b> " + this.element.nombre + "(" + this.id + ")</b>:  Error de conector: El conector no tiene ninguna instancia asociada.</font>";
                this.valid = false;
            }
            else if (this.p1.relation == null && !isElementInLinear(this.p1.relation)) {
                this.errorImg(context, this.p1, this.p1, "./img/alert.png");
                this.validmessage = "<img src=\"./img/alert.png\" width=\"12px\" height=\"12px\"/><font color=\"red\" > - Instancia de<b> " + this.element.nombre + "(" + this.id + ")</b>:  Error de conector: No hay una instancia requerida conectada en el origen.</font>";
                this.valid = false;
            }
            else if (this.p2.relation == null && !isElementInLinear(this.p2.relation)) {
                this.errorImg(context, this.p2, this.p2, "./img/alert.png");
                this.validmessage = "<img src=\"./img/alert.png\" width=\"12px\" height=\"12px\"/><font color=\"red\" > - Instancia de<b> " + this.element.nombre + "(" + this.id + ")</b>:  Error de conector: No hay instancia requerida conectada en el destino.</font>";
                this.valid = false;
            } else {
                this.valid = true;
            }

        }


        if (this.bendPoints.length > 0) {
            if (this.arrowStyle == 0 || this.arrowStyle == 1) {
                this.arrowHead(context, this.p1, this.bendPoints[0], this.arrowSize, this.arrowColor);
            }
            if (this.arrowStyle == 0 || this.arrowStyle == 2) {
                this.arrowHead(context, this.p2, this.bendPoints[this.bendPoints.length - 1], this.arrowSize, this.arrowColor);

            }


            //drawArrow(context,this.p1.x,this.p1.y,this.bendPoints[0].x,this.bendPoints[0].y,1,2,null,null);
            //drawArrow(context,this.bendPoints[this.bendPoints.length-1].x,this.bendPoints[this.bendPoints.length-1].y,this.p2.x,this.p2.y,1,1,null,null);
        } else {
            if (this.arrowStyle == 0 || this.arrowStyle == 1) {
                this.arrowHead(context, this.p1, this.p2, this.arrowSize, this.arrowColor);
            }
            if (this.arrowStyle == 0 || this.arrowStyle == 2) {
                this.arrowHead(context, this.p2, this.p1, this.arrowSize, this.arrowColor);
            }


        }


        if (mySel === this) {

            context.strokeStyle = mySelColor;
            context.fillStyle = this.fill;


            selectionHandles[0].x = this.p1.x;
            selectionHandles[0].y = this.p1.y;

            selectionHandles[1].x = this.p2.x;
            selectionHandles[1].y = this.p2.y;


            for (var i = 0; i < this.bendPoints.length; i++) {
                selectionHandles[i + 2].x = this.bendPoints[i].x;
                selectionHandles[i + 2].y = this.bendPoints[i].y;

            }


            for (var i = 0; i < 2 + this.bendPoints.length; i++) {
                var cur = selectionHandles[i];
                context.fillStyle = mySelBoxColor;
                context.fillRect(cur.x - (mySelBoxSize / 2), cur.y - (mySelBoxSize / 2), mySelBoxSize, mySelBoxSize);
            }
        }

    } // end draw

}

//================= TEXTBOX =========================
function TextBox() {
    this.id = 0;
    this.parent = {};
    this.valid = true;
    this.validmessage = "Ok";
    this.x = 0;
    this.y = 0;
    this.w = 1;
    this.h = 1;
    this.deletable = false;
    this.deltax = 0;
    this.deltay = 0;
    this.wResizePolice = "sw";
    this.hResizePolice = "sh";
    this.xMovePolice = "sx";
    this.yMovePolice = "sy";
    this.resizeflag = 3;
    this.element = {};
    this.words = [];
    this.separator = " ";

    this.fill = '#444444';
    this.setFill = function(textid) {
        this.fill = $("#" + textid).val();
    }
    this.img;
    this.setImg = function(textid) {
        var imgl = new Image();

        imgl.onload = function() {
            this.img = imgl;

        };
        imgl.src = $("#" + textid).val();

    }
    this.forecolor;
    this.font = "12px Arial";
    this.setFont = function(textid) {
        this.font = $("#" + textid).val();
    }
    this.align = "LEFT";
    this.setAlign = function(textid) {
        this.align = $("#" + textid).val();
    }
    this.showRect = false;
    this.xmiString = function() {
        var str = "<" + getXMIRelationName(this.element.nombre) + " id=\"" + this.id + "\" ";
        var missAtr = new Array();


        for (var j = 0; j < this.words.length; j++) {
            str += " " + this.words[j].title.nombre + "=\"" + this.words[j].text + "\"";
            missAtr.push(this.words[j].title.nombre);
        }


        for (var i = 0; i < this.element.atributos.length; i++) {
            var enc = false;
            for (var j = 0; j < missAtr.length && !enc; j++) {
                if (this.element.atributos[i].nombre == missAtr[j] || this.element.atributos[i].nombre == "id") {
                    enc = true;
                }
            }
            if (!enc) {
                str += " " + this.element.atributos[i].nombre + "=\"\"";
            }
        }


        str += "/>";
        return str;
    }
    this.buildPropBoard = function() {
        var prptxt = 0;
        var propstr = "<table style=\"width: 100%; height: 100%;\" border=\"1px\" cellspacing=\"0px\"><tr><td><b>Atributos de la Instancia.</b><td> <b>Valor</b></td></tr>";

        for (var j = 0; j < this.words.length; j++) {
            propstr += " <tr><td><label for=\"pr" + prptxt + "\">" + this.words[j].title + "</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.words[j].text + "\" type=\"text\" onKeyPress=\"mySel.words[" + j + "].setText('pr" + prptxt + "');\"/></td></tr>";
            prptxt++;
        }



        propstr += "<tr><td><b>Propiedades Visuales.</b><td> <b>Valor</b></td></tr>";
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Color de letra</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.fill + "\" type=\"text\" onKeyPress=\"mySel.setFill('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Fuente</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.font + "\" type=\"text\" onKeyPress=\"mySel.setFont('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Alineacion</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.align + "\" type=\"text\" onKeyPress=\"mySel.setAlign('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;

        propstr += "</table>";
        refreshPropBoard(propstr, "TextBox " + this.id);
    }
    this.persistString = function() {
        var imgstr = "";
        if (this.img != null) {
            imgstr = this.img.src;
        }
        var str = "<shape type=\"textbox\" id=\"" + this.id + "\" delete=\"" + this.deletable + "\" parent=\"" + this.parent.id + "\" separator=\"" + this.separator + "\" rect=\"" + this.showRect + "\" align=\"" + this.align + "\" font=\"" + this.font + "\" forecolor=\"" + this.forecolor + "\" img=\"" + imgstr + "\" x=\"" + this.x + "\" y=\"" + this.y + "\" w=\"" + this.w + "\" h=\"" + this.h + "\" wrpolice=\"" + this.wResizePolice + "\" hrpolice=\"" + this.hResizePolice + "\" xmpolice=\"" + this.xMovePolice + "\"  ympolice=\"" + this.yMovePolice + "\" resizeFlg=\"" + this.resizeflag + "\" element=\"" + this.element.nombre + "\" fill=\"" + this.fill + "\"> ";
        str += "<words> ";

        for (var i = 0; i < this.words.length; i++) {
            str += this.words[i].persistString() + " ";
        }
        str += "</words> </shape>";
        return str;
    }
    this.toObject = function(xmlSegment, parent) {
        var rect = new TextBox;

        if (!descriptorLoad) {
            rect.id = parseInt(xmlSegment.attributes.getNamedItem("id").value);
        } else {
            rect.id = actualId;
            actualId++;
        }
        rect.element = buscarClase(xmlSegment.attributes.getNamedItem("element").value);
        rect.parent = parent;

        rect.x = textualCalculator(rect, xmlSegment.attributes.getNamedItem("x").value);
        rect.y = textualCalculator(rect, xmlSegment.attributes.getNamedItem("y").value);
        rect.w = textualCalculator(rect, xmlSegment.attributes.getNamedItem("w").value);
        rect.h = textualCalculator(rect, xmlSegment.attributes.getNamedItem("h").value);

        rect.words = new Array();

        rect.wResizePolice = xmlSegment.attributes.getNamedItem("wrpolice").value;
        rect.deletable = xmlSegment.attributes.getNamedItem("delete").value === "false" ? false : true;
        rect.hResizePolice = xmlSegment.attributes.getNamedItem("hrpolice").value;
        rect.font = xmlSegment.attributes.getNamedItem("font").value;
        rect.fill = xmlSegment.attributes.getNamedItem("fill").value;
        var imgl = new Image();

        imgl.onload = function() {
            rect.img = imgl;

        };
        imgl.src = xmlSegment.attributes.getNamedItem("img").value;
        rect.align = xmlSegment.attributes.getNamedItem("align").value;
        rect.showRect = xmlSegment.attributes.getNamedItem("rect").value === "false" ? false : true;
        rect.xMovePolice = xmlSegment.attributes.getNamedItem("xmpolice").value;
        rect.yMovePolice = xmlSegment.attributes.getNamedItem("ympolice").value;

        var ch = xmlSegment.childNodes;
        for (var f = 0; f < ch.length; f++) {
            //console.log("Txxx->" + ch[f].nodeName);
            if (ch[f].nodeName == "words") {
                var chld = ch[f].childNodes;
                //console.log("Tu->" + chld.length);
                for (var i = 0; i < chld.length; i++) {
                    //console.log("Tyyyyy->" + chld[i].nodeName);
                    if (chld[i].nodeName == "word") {
                        rect.words.push(new Word({}, {}).toObject(chld[i], rect));
                    }
                }
            }
        }

        return rect;
    }
    this.moveAct = function(mx, my) {



        this.x = mx - this.deltax;
        this.y = my - this.deltay;
        verifyContainmentOnModel();

    }

    this.moveParent = function() {


        if (this.parent instanceof FlowBox) {
            this.parent.moveParent(mx, my);
        } else {
            this.parent.moveAct(mx, my);
        }


    }

    this.calculateParent = function() {

        if (this.parent instanceof FlowBox) {
            this.parent.calculateParent(mx, my);
        } else {
            this.parent.calculateMove(mx, my);
        }


    }

    this.calculateMove = function(mx, my) {


        this.deltax = mx - this.x;
        this.deltay = my - this.y;
        this.x = mx - this.deltax;
        this.y = my - this.deltay;

    }
    this.resize = function() {
        if (this.resizeflag == 3) {
            this.w = textualCalculator(this, this.wResizePolice);
            this.h = textualCalculator(this, this.hResizePolice);
        }
    }
    this.move = function() {
        if (this.resizeflag == 3) {
            this.x = textualCalculator(this, this.xMovePolice);
            this.y = textualCalculator(this, this.yMovePolice);
        }
    }
}
function Word(title, text) {
    this.title = title;
    this.text = text;
    this.setText = function(textid) {
        this.text = $("#" + textid).val();

    }
    this.persistString = function() {
        return "<word title=\"" + this.title.nombre + "\" text=\"" + this.text + "\"\></word>";
    }
    this.toObject = function(xmlSegment, parent) {
        var rect = new Word(parent.element.getAtribute(xmlSegment.attributes.getNamedItem("title").value), xmlSegment.attributes.getNamedItem("text").value);


        return rect;
    }

}


TextBox.prototype = {
    draw: function(context, optionalColor) {


        if (context === gctx) {
            context.fillStyle = 'black';
            context.fillRect(this.x, this.y, this.w, this.h);
        } else {
            if (this.img != null) {
                //var e = new Image();
                //e.src = this.img;
                //context.fillStyle = this.fill;

                //context.drawImage(e, this.x, this.y, this.w, this.h);
                drawSVG(context, this.img, this.x, this.y, this.w, this.h);
            }
            context.font = this.font;

            var failatt = new Array();

            for (var i = 0; i < this.words.length; i++) {

                if (!validateValueType(this.words[i].title.tipo, this.words[i].text)) {
                    ////console.log("typ-"+this.words[i].text);
                    failatt.push(this.words[i].title);
                }
            }

            if (failatt.length > 0) {

                var e = new Image();
                e.src = "./img/alert.png";
                context.fillStyle = this.fill;
                context.drawImage(e, this.x, this.y, 12, 12);
                var str = "";
                for (var i = 0; i < failatt.length; i++) {
                    str += failatt[i].nombre + "(" + failatt[i].tipo + "),";
                }
                this.validmessage = "<img src=\"./img/alert.png\" width=\"12px\" height=\"12px\"/><font color=\"red\" > - Instancia de<b> " + this.element.nombre + "(" + this.id + ")</b>:  Error de Atributos: Los valores no coinciden con el tipo de dato: <b>" + str + "</b></font>";
                this.valid = false;
            } else {
                this.valid = true;
                this.validmessage = "";
            }




            var str = "";



            for (var i = 0; i < this.words.length; i++) {

                str = str + this.words[i].text + this.separator;
            }
            context.fillStyle = this.fill;
            if (this.align == "RIGHT") {
                context.textAlign = 'right';
                context.textBaseline = 'middle';
                context.fillText(str, this.x + this.w, this.y + (this.h / 2), this.w, this.h);

            } else if (this.align == "CENTER") {
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(str, this.x + (this.w / 2), this.y + (this.h / 2), this.w, this.h);
            } else {
                context.textAlign = 'left';
                context.textBaseline = 'middle';
                context.fillText(str, this.x, this.y + (this.h / 2), this.w, this.h);
            }
            //context.textAlign = 'center';
            //context.fillStyle = this.fill;
            //context.fillRect(this.x, this.y, this.w, this.h);
            //context.fillText(str, this.x, this.y, this.w, this.h);



        }
        if (mySel === this) {
            context.strokeStyle = mySelColor;
            context.lineWidth = mySelWidth;
            context.strokeRect(this.x, this.y, this.w, this.h);
        }


        //alert("asd");





    } // end draw

}


//================= FLOWBOX =========================
function FlowBox() {
    this.id = 0;
    this.parent = {};
    this.valid = true;
    this.validmessage = "Ok";
    this.x = 0;
    this.y = 0;
    this.w = 1;
    this.h = 1;
    this.deletable = false;
    this.deltax = 0;
    this.deltay = 0;
    this.childsElements = new Array();
    this.wResizePolice = "sw";
    this.hResizePolice = "sh";
    this.xMovePolice = "sx";
    this.yMovePolice = "sy";
    this.resizeflag = 3;
    this.element = {};
    this.stmode = 0;

    this.fill = '#444444';
    this.img;
    this.setImg = function(textid) {
        var imgl = new Image();

        imgl.onload = function() {
            this.img = imgl;

        };
        imgl.src = $("#" + textid).val();

    }
    this.forecolor;
    this.font = "12px Arial";
    this.align = "LEFT";
    this.showRect = false;
    this.buildPropBoard = function() {
        var prptxt = 0;
        var propstr = "<table style=\"width: 100%; height: 100%;\" border=\"1px\" cellspacing=\"0px\"><tr><td><b>Atributos de la Instancia.</b><td> <b>Valor</b></td></tr>";
        for (var i = 0; i < this.parent.childsElements.length; i++) {
            if (this.parent.childsElements[i] instanceof TextBox) {
                for (var j = 0; j < this.parent.childsElements[i].words.length; j++) {
                    propstr += " <tr><td><label for=\"pr" + prptxt + "\">" + this.parent.childsElements[i].words[j].title + "</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + this.parent.childsElements[i].words[j].text + "\" type=\"text\" onKeyPress=\"mySel.parent.childsElements[" + i + "].words[" + j + "].setText('pr" + prptxt + "');\"/></td></tr>";
                    prptxt++;
                }
            }
        }

        propstr += "<tr><td><b>Propiedades Visuales.</b><td> <b>Valor</b></td></tr>";
        var imgstr = "";
        if (this.img != null) {
            imgstr = this.img.src;
        }
        propstr += " <tr><td><label for=\"pr" + prptxt + "\">Imagen de fondo</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + imgstr + "\" type=\"text\" onKeyPress=\"mySel.setImg('pr" + prptxt + "');\"/></td></tr>";
        prptxt++;

        propstr += "</table>";
        refreshPropBoard(propstr, "FlowBox " + this.id);
    }
    this.persistString = function() {
        var imgstr = "";
        if (this.img != null) {
            imgstr = this.img.src;
        }
        var str = "<shape type=\"flowbox\" stmode = \"" + this.stmode + "\" id=\"" + this.id + "\" parent=\"" + this.parent.id + "\" showRect=\"" + this.showRect + "\" align=\"" + this.align + "\" img=\"" + imgstr + "\" deleteable=\"" + this.deleteable + "\" x=\"" + this.x + "\" y=\"" + this.y + "\" w=\"" + this.w + "\" h=\"" + this.h + "\" wrpolice=\"" + this.wResizePolice + "\" hrpolice=\"" + this.hResizePolice + "\" xmpolice=\"" + this.xMovePolice + "\"  ympolice=\"" + this.yMovePolice + "\" resizeFlg=\"" + this.resizeflag + "\" element=\"" + this.element.nombre + "\" fill=\"" + this.fill + "\"> ";

        str += "<childsElements> ";
        for (var i = 0; i < this.childsElements.length; i++) {
            str += this.childsElements[i].persistString() + " ";
        }
        str += "</childsElements> </shape>";
        return str;
    }
    this.toObject = function(xmlSegment, parent) {

        var rect = new FlowBox();
        rect.parent = parent;
        rect.x = textualCalculator(rect, xmlSegment.attributes.getNamedItem("x").value);
        rect.y = textualCalculator(rect, xmlSegment.attributes.getNamedItem("y").value);
        rect.w = textualCalculator(rect, xmlSegment.attributes.getNamedItem("w").value);
        rect.h = textualCalculator(rect, xmlSegment.attributes.getNamedItem("h").value);

        if (!descriptorLoad) {
            rect.id = parseInt(xmlSegment.attributes.getNamedItem("id").value);
        } else {
            rect.id = actualId;
            actualId++;
        }
        rect.stmode = xmlSegment.attributes.getNamedItem("stmode").value;
        rect.element = buscarClase(xmlSegment.attributes.getNamedItem("element").value);
        rect.resizeflag = xmlSegment.attributes.getNamedItem("resizeFlg").value;

        rect.wResizePolice = xmlSegment.attributes.getNamedItem("wrpolice").value;

        rect.hResizePolice = xmlSegment.attributes.getNamedItem("hrpolice").value;
        rect.xMovePolice = xmlSegment.attributes.getNamedItem("xmpolice").value;
        rect.yMovePolice = xmlSegment.attributes.getNamedItem("ympolice").value;
        rect.fill = xmlSegment.attributes.getNamedItem("fill").value;
        var imgl = new Image();

        imgl.onload = function() {
            rect.img = imgl;

        };
        imgl.src = xmlSegment.attributes.getNamedItem("img").value;
        rect.deletable = xmlSegment.attributes.getNamedItem("deleteable").value === "false" ? false : true;
        rect.showRect = xmlSegment.attributes.getNamedItem("showRect").value === "false" ? false : true;
        var ch = xmlSegment.childNodes;
        for (var f = 0; f < ch.length; f++) {
            if (ch[f].nodeName == "childsElements") {

                var chld = ch[f].childNodes;

                for (var i = 0; i < chld.length; i++) {
                    //console.log("T->" + chld[i].nodeName);
                    if (chld[i].nodeName == "shape") {
                        rect.childsElements.push(new TextBox().toObject(chld[i], rect));
                    }
                }
            }
        }

        return rect;
    }
    this.moveAct = function(mx, my) {

        this.x = mx - this.deltax;
        this.y = my - this.deltay;
        verifyContainmentOnModel();


    }
    this.moveParent = function() {


        this.parent.moveAct(mx, my);


    }

    this.calculateParent = function() {


        this.parent.calculateMove(mx, my);


    }
    this.calculateMove = function(mx, my) {

        this.deltax = mx - this.x;
        this.deltay = my - this.y;
        this.x = mx - this.deltax;
        this.y = my - this.deltay;




    }
    this.resize = function() {
        if (this.resizeflag == 3) {
            this.w = textualCalculator(this, this.wResizePolice);
            this.h = textualCalculator(this, this.hResizePolice);
        }
    }
    this.move = function() {
        if (this.resizeflag == 3) {
            this.x = textualCalculator(this, this.xMovePolice);
            this.y = textualCalculator(this, this.yMovePolice);
        }


    }
    this.addChild = function(elem) {


        this.childsElements.push(elem);


    }
    this.removeChild = function(elem) {

        for (var i = 0; i < this.childsElements.length; i++) {
            if (elem == this.childsElements[i]) {
                this.childsElements.splice(i, 1);
            }

        }
    }
    this.rebuildLinear = function() {

        for (var i = 0; i < this.childsElements.length; i++) {
            modelElementsLinear.push(this.childsElements[i]);

        }
    }
}


FlowBox.prototype = {
    draw: function(context, optionalColor) {

        if (mySel === this) {
            context.strokeStyle = mySelColor;
            context.lineWidth = mySelWidth;
            context.strokeRect(this.x, this.y, this.w, this.h);
        }
        if (context === gctx) {
            context.fillStyle = 'black';
            context.fillRect(this.x, this.y, this.w, this.h);
        } else {
            if (this.img != null) {
                //var e = new Image();
                //e.src = this.img;
                //context.fillStyle = this.fill;

                //context.drawImage(e, this.x, this.y, this.w, this.h);
                drawSVG(context, this.img, this.x, this.y, this.w, this.h);
            }
            var ix = this.x + 2;
            var iy = this.y + 2;
            for (var i = 0; i < this.childsElements.length; i++) {
                if (this.stmode == 0) {
                    this.childsElements[i].h = (this.h / this.childsElements.length);
                } else {

                    this.childsElements[i].h = textualCalculator(this.childsElements[i], this.childsElements[i].hResizePolice);
                }
                this.childsElements[i].w = this.w - 4;

                this.childsElements[i].x = ix;
                this.childsElements[i].y = iy;
                this.childsElements[i].draw(context, optionalColor);
                if (this.stmode == 0) {
                    iy = iy + ((this.h / this.childsElements.length) + 2);
                } else {

                    iy = iy + (this.childsElements[i].h + 2);
                }


            }



        }


        //alert("asd");





    } // end draw

}
//===================================================
//================= FUNCIONES DE AYUDA PARA CALCULOS DE AREA =========================
function modulevector(p1, p2) {
    var a = (p2.x - p1.x) * (p2.x - p1.x);
    var b = (p2.y - p1.y) * (p2.y - p1.y);

    return Math.sqrt(a + b);
}
function isBetween(a, b, c, dist) {

    var seg1 = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
    var seg2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
    var u = 0;
    if (seg2 != 0) {
        u = seg1 / seg2;
    }

    //alert(u);

    if (u >= 0 && u <= 1) {
        var p = new point(a.x + u * (b.x - a.x), a.y + u * (b.y - a.y));
        var modul = modulevector(p, c);
        //alert(p.x + " - " + p.y+"; "+modul);
        if (modul == 0) {
            // alert("2");
            return true;
        } else {

            if (modul <= dist) {
                //alert("!");
                return true;
            }

        }
    }
    return false;

}


//===================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//==========CONSTRUCCION DE FIGURAS======================
//======================================================




//==========AGREGAR UN BOX2======================
function addRect(id, element, x, y, w, h, fill, img, resizeflag, wpolice, hpolice, xpolice, ypolice, selparent) {
    var rect = new Box2;
    rect.parent = selparent;
    rect.x = textualCalculator(rect, x);
    rect.y = textualCalculator(rect, y);
    rect.w = textualCalculator(rect, w);
    rect.h = textualCalculator(rect, h);
    actualId++;
    rect.id = id;
    rect.element = element;
    rect.resizeflag = resizeflag;

    rect.wResizePolice = wpolice;

    rect.hResizePolice = hpolice;
    rect.xMovePolice = xpolice;
    rect.yMovePolice = ypolice;
    rect.fill = fill;
    rect.img = img;
    rect.atspots = new Array();
    rect.atspots[0] = new point(rect.x, rect.y);

    rect.atspots[1] = new point(rect.x + rect.w, rect.y);


    rect.atspots[2] = new point(rect.x + rect.w / 2, rect.y);


    //middle left
    rect.atspots[3] = new point(rect.x, rect.y + rect.h / 2);


    //middle right
    rect.atspots[4] = new point(rect.x + rect.w, rect.y + rect.h / 2);


    //bottom left, middle, right
    rect.atspots[6] = new point(rect.x + rect.w / 2, rect.y + rect.h);
    rect.atspots[5] = new point(rect.x, rect.y + rect.h);


    rect.atspots[7] = new point(rect.x + rect.w, rect.y + rect.h);
    invalidate();
    addElement(rect);

    return rect;
}
//==========AGREGAR TEXTBOX======================
function addText(id, element, x, y, w, h, fill, img, wpolice, hpolice, xpolice, ypolice, selparent, wordlinks, textalign, showrect, font, deletable) {
    var rect = new TextBox;
    actualId++;
    rect.id = id;
    rect.element = element;
    rect.parent = selparent;

    rect.x = textualCalculator(rect, x);

    rect.y = textualCalculator(rect, y);
    rect.w = textualCalculator(rect, w);

    rect.h = textualCalculator(rect, h);

    rect.words = wordlinks;

    rect.wResizePolice = wpolice;
    rect.deletable = deletable;
    rect.hResizePolice = hpolice;
    rect.font = font;
    rect.fill = fill;
    rect.img = img;
    rect.align = textalign;
    rect.showRect = showrect;
    rect.xMovePolice = xpolice;
    rect.yMovePolice = ypolice;
    invalidate();
    selparent.childsElements.push(rect);
    modelElementsLinear.push(rect);



    return rect;
}
//==========AGREGAR FLOWBOX======================
function addFlow(id, element, x, y, w, h, fill, img, wpolice, hpolice, xpolice, ypolice, initialChilds, selparent, showrect, deletable, strechMode) {
    var rect = new FlowBox;
    actualId++;
    rect.id = id;

    rect.element = element;
    rect.parent = selparent;

    rect.x = textualCalculator(rect, x);

    rect.y = textualCalculator(rect, y);
    rect.w = textualCalculator(rect, w);

    rect.h = textualCalculator(rect, h);
    rect.childsElements = initialChilds;

    rect.wResizePolice = wpolice;
    rect.deletable = deletable;
    rect.hResizePolice = hpolice;

    rect.fill = fill;
    rect.img = img;
    rect.stmode = strechMode;
    rect.showRect = showrect;
    rect.xMovePolice = xpolice;
    rect.yMovePolice = ypolice;
    invalidate();
    selparent.childsElements.push(rect);
    modelElementsLinear.push(rect);


    return rect;
}
//==========AGREGAR UN LINK======================
function addLink(id, element, p1rel, p2rel, x, y, x2, y2, fill, w, style, arrStyle, arrColor, arrSize) {
    var rect = new Link;
    actualId++;
    rect.id = id;

    rect.element = element;
    rect.p1 = new point(x, y);
    rect.p1rel = p1rel;
    rect.p2 = new point(x2, y2);
    rect.p2rel = p2rel;

    rect.fill = fill;
    rect.w = w;
    rect.arrowColor = arrColor;
    rect.arrowSize = arrSize;
    rect.arrowStyle = arrStyle;
    if (style == 'dash') {
        rect.dash = true;
    } else {
        rect.dash = false;
    }
    invalidate();
    addElement(rect);

    return rect;
}


//===================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//==========PROCESAMIENTO DEL DIBUJO EN CANVAS======================
//======================================================


// Inicializacion del canvas (al ejecutar el script por primera vez)
function init2() {
    canvas = document.getElementById('canvas2');
    HEIGHT = canvas.height;
    WIDTH = canvas.width;
    ctx = canvas.getContext('2d');
    ghostcanvas = document.createElement('canvas');
    ghostcanvas.height = HEIGHT;
    ghostcanvas.width = WIDTH;
    gctx = ghostcanvas.getContext('2d');

    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.onselectstart = function() {
        return false;
    }

    // fixes mouse co-ordinate problems when there's a border or padding
    // see getMouse for more detail
    if (document.defaultView && document.defaultView.getComputedStyle) {
        stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }

    // make mainDraw() fire every INTERVAL milliseconds
    setInterval(mainDraw, INTERVAL);

    // set our events. Up and down are for dragging,
    // double click is for making new boxes
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.ondblclick = myDblClick;
    canvas.onmousemove = myMove;

    // set up the selection handle boxes
    for (var i = 0; i < 8; i++) {
        var rect = new point(0, 0);
        selectionHandles.push(rect);
    }

    drawOverview();
    ctx.font = 'italic 24pt Calibri';
    ctx.fillText('Cargue un editor para abrir o crear un modelo utilizando el siguiente boton:', 80, 100);
    var imageObj = new Image();

    imageObj.onload = function() {
        ctx.drawImage(imageObj, 400, 200);
    };
    imageObj.src = 'img/preview.png';
}

function drawOverview() {
    invalidate();
    mainDraw();
    var strDataURI = document.getElementById("canvas2").toDataURL("image/png");
    refreshOverview(strDataURI);
}
function buscarInstanciaPorId(id) {

    for (var i = 0; i < modelElementsLinear.length; i++) {
        if (modelElementsLinear[i].id == id) {
            return modelElementsLinear[i];
        }
    }
    return null;
}
function cuadricula() {

    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0, 0);

    ctx.strokeStyle = "#B8B8B8";
    ctx.stroke();

}
function setCanvasSize(w, h) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clear(gctx);
    WIDTH = w;
    HEIGHT = h;
    canvas.width = w;
    canvas.height = h;
    ghostcanvas.width = w;
    ghostcanvas.height = h;
    //init2();
    canvasValid = false;
    mainDraw();
}
function buildPropModel() {
    var prptxt = 0;
    var propstr = "<table style=\"width: 100%; height: 100%;\" border=\"1px\" cellspacing=\"0px\"><tr><td><b>Atributos del Modelo.</b><td> <b>Valor</b></td></tr>";



    propstr += " <tr><td><label for=\"pr" + prptxt + "\">Nombre</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + modelname + "\" type=\"text\" disabled/></td></tr>";
    prptxt++;
    propstr += " <tr><td><label for=\"pr" + prptxt + "\">Ancho</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + getCanvasW() + "\" type=\"text\" disabled/></td></tr>";
    prptxt++;
    propstr += " <tr><td><label for=\"pr" + prptxt + "\">Alto</label></td><td><input  id=\"pr" + prptxt + "\" value=\"" + getCanvasH() + "\" type=\"text\" disabled/></td></tr>";
    prptxt++;
    propstr += "</table>";
    refreshPropBoard(propstr, modelname);
}
function getCanvasW() {
    return canvas.width;

}
function getCanvasH() {

    return canvas.height;
}
//Limpiar Canvas
function clear(c) {
    c.clearRect(0, 0, canvas.width, canvas.height);
}
function clearModel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    modelElements = new Array();
    modelElementsLinear = new Array();
    invalidate();
    mainDraw();
    buildPropModel();
}
// Funcion de ayuda que pone Los Links a dibujarse sobre todas las cosas (on top) para que sean seleccionados.
function linksToTop() {

    for (var i = 0; i < modelElements.length - 1; i++) {
        for (var j = i; j < modelElements.length; j++) {

            if (modelElements[j] instanceof Box2) {
                var tmp = modelElements[i];
                modelElements[i] = modelElements[j];
                modelElements[j] = tmp;
            }

        }
    }

}


// añade un elemento nuevo (de cualquier tipo) al dibujo, en 'modelElements' y 'modelElementsLinear'.
// Este metodo agrega los elementos de tal manera que se respeten las contenecias (manejadas por el arbol ModelElement) y otras reglas establecidas en el Metamodelo
function addElement(elem) {
    //modelElementsLinear.push(elem);
    if (elem instanceof Link) {
        modelElements.push(elem);
        //linksToTop();

    } else if (elem instanceof Box2) {
        var found = false;
        for (var i = 0; i < modelElements.length && !found; i++) {
            if (modelElements[i] instanceof Box2) {
                if (modelElements[i].isInArea(elem)) {
                    modelElements[i].addElement(elem);
                    found = true;
                }
            }
        }
        if (found == false) {
            modelElements.push(elem);
            var elems = modelElements;
        }
        //linksToTop();
    }
    rebuildLinear();
    linksToTop();

}

// Este metodo elimina el elemento del arbol 'modelElement' y 'modelElementLinear'
function deleteElement(elem) {



    for (var i = 0; i < modelElements.length; i++) {
        if (modelElements[i] instanceof Box2) {
            if (elem == modelElements[i]) {
                modelElements.splice(i, 1);
            } else {
                modelElements[i].deleteElement(elem);
            }
        } else {
            if (elem == modelElements[i]) {
                modelElements.splice(i, 1);
            }
        }
    }
    linksToTop();
    rebuildLinear();


}

function isElementInLinear(elem) {

    if (elem != null) {
        for (var i = 0; i < modelElementsLinear.length; i++) {
            if (elem.id == modelElementsLinear[i].id) {

                return true;
            }
        }
    }
    return false;
}
// Funcion auxiliar que reconstruye 'modelElementLinear' Debido a deleciones de elementos padre con muchos hijos (que tambien se borran).
function rebuildLinear() {
    modelElementsLinear = [];
    for (var i = 0; i < modelElements.length; i++) {
        ////console.log("<<>>>"+ modelElements.length);
        modelElementsLinear.push(modelElements[i]);
        if (modelElements[i] instanceof Box2) {
            modelElements[i].rebuildLinear();
        }
    }

}
//Loop Principal de Dibujo (refresca el canvas). Dibuja todas las figuras que existen en 'modelElements' y sus hijos.
function mainDraw() {

    if (canvasValid == false) {
        clear(ctx);
        cuadricula();
        try {
            var l = modelElements.length;
            ////console.log("-||||||->"+l);
            for (var i = 0; i < l; i++) {
                modelElements[i].draw(ctx);
                if (modelElements[i] instanceof Box2) {
                    modelElements[i].drawChilds();
                }
            }
            generateErrorLog();

        } catch (e) {

        }
        // Add stuff you want drawn on top all the time here

        canvasValid = true;
    }
}

//===================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//==========MANEJO DE DISPOSITIVOS DE ENTRADA===========
//======================================================


//================Mouse==================
// Movimiento de mouse
function myMove(e) {
    if (isDrag && !(mySel instanceof Link)) {
        //if (mySel instanceof Box2) {
        mySel.moveAct(mx, my);
        if (mySel instanceof TextBox || mySel instanceof FlowBox) {
            mySel.moveParent(mx, my);
        }
        //}


        // something is changing position so we better invalidate the canvas!
        invalidate();
    } else if (isResizeDrag) {
        if (mySel instanceof Box2) {
            resizeBox();
        } else if (mySel instanceof Link) {
            isLinkBuilt = true;
            resizeLink();
            // mainDraw();
        }

        invalidate();
    }

    getMouse(e);
    // if there's a selection see if we grabbed one of the selection handles
    if (mySel !== null && !isResizeDrag) {
        for (var i = 0; i < 8; i++) {
            // 0  1  2
            // 3     4
            // 5  6  7

            var cur = selectionHandles[i];

            // we dont need to use the ghost context because
            // selection handles will always be rectangles
            if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
                    my >= cur.y && my <= cur.y + mySelBoxSize) {
                // we found one!
                expectResize = i;
                buildContextMenuBasedOnSelItem();
                invalidate();
                if (mySel instanceof Box2) {
                    switch (i) {
                        case 0:
                            this.style.cursor = 'nw-resize';
                            break;
                        case 1:
                            this.style.cursor = 'n-resize';
                            break;
                        case 2:
                            this.style.cursor = 'ne-resize';
                            break;
                        case 3:
                            this.style.cursor = 'w-resize';
                            break;
                        case 4:
                            this.style.cursor = 'e-resize';
                            break;
                        case 5:
                            this.style.cursor = 'sw-resize';
                            break;
                        case 6:
                            this.style.cursor = 's-resize';
                            break;
                        case 7:
                            this.style.cursor = 'se-resize';
                            break;
                    }
                } else {
                    this.style.cursor = 'crosshair';
                }
                return;
            }

        }
        // not over a selection box, return to normal
        isResizeDrag = false;
        expectResize = -1;
        this.style.cursor = 'auto';
    }

}

// Mouse UP
function myUp() {

    isDrag = false;
    isResizeDrag = false;
    isLinkBuilt = false;

    expectResize = -1;
    canvasValid = false;

    mainDraw();
    drawOverview();
}


// Mouse Doble Clic.
function myDblClick(e) {

    // for this method width and height determine the starting X and Y, too.
    // so I left them as vars in case someone wanted to make them args for something and copy this code

}

//Mouse Down
function myDown(e) {
    getMouse(e);
    if (!addflag) {
        //we are over a selection box
        if (expectResize !== -1) {
            isResizeDrag = true;
            return;
        }

        clear(gctx);
        var l = modelElementsLinear.length;
        for (var i = l - 1; i >= 0; i--) {
            // draw shape onto ghost context
            modelElementsLinear[i].draw(gctx);

            // get image data at the mouse x,y pixel
            var imageData = gctx.getImageData(mx, my, 1, 1);
            var index = (mx + my * imageData.width) * 4;

            // if the mouse pixel exists, select and break
            if (imageData.data[3] > 0) {
                mySel = modelElementsLinear[i];
                mySelIdx = i;
                buildContextMenuBasedOnSelItem();
                invalidate();
                clear(gctx);

                mySel.calculateMove(mx, my);
                if (mySel instanceof TextBox || mySel instanceof FlowBox) {
                    mySel.calculateParent(mx, my);
                }

                isDrag = true;

                mySel.buildPropBoard();


                return;
            }
        }
        buildPropModel();
    } else {
        this.style.cursor = 'default';
        addShapeFromElementId(addtype, null);
        /*
         if (addtype == 'Boxes2') {
         
         var par = addRect(actualId, buscarClase("Classroom"), "100 / 2)", " my - (100 / 2)", "150", "200", 'rgba(0,0,0,0.7)', 'umlclass.svg', 0, "sw", "sh", "sx", "sy", {});
         var wds = new Array();
         
         wds.push(new Word(buscarClase("Classroom").getAtribute("name"), "Title"));
         
         
         addText(actualId, buscarClase("Classroom"), "px+4", "py+4", "pw-8", "(ph/9)-8", 'rgba(0,0,0,0.7)', null, "pw-8", "(ph/9)-8", "px+4", "py+4", par, wds, "CENTER", true, "12px Arial", false);
         addFlow(actualId, buscarClase("Classroom"), "px+4", "py+(ph/9)+ 4", "pw-8", "(ph-(ph/9))-8", 'rgba(0,0,0,0.7)', null, "pw-8", "(ph-(ph/9))-8", "px+4", "py+(ph/9)+ 4", new Array(), par, false, true, 1);
         } else if (addtype == 'Link') {
         addLink(actualId, buscarClase("Friendship"), buscarRelacionN("Friendship", "Classroom"), buscarRelacionN("Friendship", "Classroom"), mx, my, mx + 50, my, 'rgba(0,0,0,0.7)', 3, 'Norm', 0, 'no', 5);
         } else if (addtype == 'LinkDash') {
         addLink(actualId, buscarClase("Friendship"), buscarRelacionN("Friendship", "Classroom"), buscarRelacionN("Friendship", "Classroom"), mx, my, mx + 50, my, 'rgba(0,0,0,0.7)', 3, 'dash', 1, 'white', 10);
         } else if (addtype == 'Cont') {
         
         addRect(actualId, buscarClase("Section"), "mx - (300 / 2)", "my - (300 / 2)", "300", "300", 'rgba(0,0,0,0.7)', 'square.svg', 0, "sw+0", "sh+0", "sx", "sy", {});
         }*/
        addFlag = false;
    }
    // havent returned means we have selected nothing
    mySel = null;
    // clear the ghost canvas for next time
    clear(gctx);
    // invalidate because we might need the selection border to disappear
    invalidate();
}
//===================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//======================================================
//==========PROCESADOR DE EDICIONES===========
//======================================================

//Verifica si el elemento Seleccionado esta en el root model (el lienzo canvas)
function verifyContainmentOnModel() {
    var f = false;
    for (var i = 0; i < modelElementsLinear.length; i++) {
        if (modelElementsLinear[i] instanceof Box2) {

            var item = mySel;

            if (mySel instanceof FlowBox) {
                item = mySel.parent;
            } else if (mySel instanceof TextBox) {
                if (mySel.parent instanceof FlowBox) {
                    item = mySel.parent.parent;
                } else {
                    item = mySel.parent;
                }

            }
            if (modelElementsLinear[i].isInArea(item)) {
                f = true;
            }
        }
    }

    if (f == false) {
        deleteElement(item);
        addElement(item);
        rebuildLinear();
    }
}

// Metodo que maneja el cambio de tamaño de un BOX2
function resizeBox() {
    // time ro resize!

    var oldx = mySel.x;
    var oldy = mySel.y;
    for (var i = 0; i < mySel.childsElements.length; i++) {
        if (mySel.childsElements[i] instanceof TextBox || mySel.childsElements[i] instanceof FlowBox) {
            mySel.childsElements[i].move();
            mySel.childsElements[i].resize();

        }
    }
    // 0  1  2
    // 3     4
    // 5  6  7
    switch (expectResize) {
        case 0:
            mySel.x = mx;
            mySel.y = my;
            mySel.w += oldx - mx;
            mySel.h += oldy - my;
            break;
        case 1:
            mySel.y = my;
            mySel.h += oldy - my;
            break;
        case 2:
            mySel.y = my;
            mySel.w = mx - oldx;
            mySel.h += oldy - my;
            break;
        case 3:
            mySel.x = mx;
            mySel.w += oldx - mx;
            break;
        case 4:
            mySel.w = mx - oldx;
            break;
        case 5:
            mySel.x = mx;
            mySel.w += oldx - mx;
            mySel.h = my - oldy;
            break;
        case 6:
            mySel.h = my - oldy;
            break;
        case 7:
            mySel.w = mx - oldx;
            mySel.h = my - oldy;
            break;
    }
    verifyContainmentOnModel();
}

//Metodo que habilita los puntos de un Link para que sean cambiados de posicion
function resizeLink() {
    // time ro resize!


    // 0  1  2
    // 3     4
    // 5  6  7
    switch (expectResize) {
        case 0:
            //mySel.x = mx;
            //mySel.y = my;
            if (modelElementsLinear.length > 1) {
                var b = true;

                for (var i = 0; i < modelElementsLinear.length && b == true; i++) {
                    if (modelElementsLinear[i] instanceof Box2 && (validateRelation(mySel, modelElementsLinear[i]) != null)) {


                        b = false;

                        mySel.p1 = modelElementsLinear[i].isNearPoint(mx, my);

                        if (mx == mySel.p1.x && my == mySel.p1.y) {
                            b = true;
                        }


                    }
                }
            } else {
                mySel.p1 = new point(mx, my);
            }

            break;
        case 1:
            //mySel.x2 = mx;
            //mySel.y2 = my;
            if (modelElementsLinear.length > 1) {
                var b = true;

                for (var i = 0; i < modelElementsLinear.length && b == true; i++) {
                    if (modelElementsLinear[i] instanceof Box2 && (validateRelation(mySel, modelElementsLinear[i]) != null)) {


                        b = false;

                        mySel.p2 = modelElementsLinear[i].isNearPoint(mx, my);

                        if (mx == mySel.p2.x && my == mySel.p2.y) {
                            b = true;
                        }


                    }
                }
            } else {
                mySel.p2 = new point(mx, my);
            }
            break;
        default:

            mySel.bendPoints[expectResize - 2].x = mx;
            mySel.bendPoints[expectResize - 2].y = my;
            break;


    }
    verifyContainmentOnModel();
}

// Happens when the mouse is clicked in the canvas


// Metodo que elimina el Item Seleccionado
function deleteSelItem() {
    if (mySel != null) {
        deleteElement(mySel);
        clear(gctx);
        clear(ctx);
        invalidate();
        mainDraw();
    }
}



function invalidate() {
    canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e) {

    var div = document.getElementById("canvas2");
    var rect = div.getBoundingClientRect();
    //alert("Coordinates: " + rect.left + "px, " + rect.top + "px");
    mx = Math.abs(e.pageX - rect.left);
    my = Math.abs(e.pageY - rect.top);
}
function addItem(id) {
    addtype = id;
    addflag = true;

}



function dashlin(ctx, x1, y1, x2, y2, dashLen, w) {
    if (dashLen == undefined)
        dashLen = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    var dX = x2 - x1;
    var dY = y2 - y1;
    var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
    var dashX = dX / dashes;
    var dashY = dY / dashes;

    var q = 0;
    while (q++ < dashes) {
        x1 += dashX;
        y1 += dashY;
        if (q % 2 == 0) {
            ctx.moveTo(x1, y1);
        } else {
            ctx.lineTo(x1, y1);
        }

    }
    if (q % 2 == 0) {
        ctx.moveTo(x2, y2);
    } else {
        ctx.lineTo(x2, y2);
    }

    ctx.lineWidth = w;
    ctx.stroke();

    ctx.closePath();
}

function findAvailableElements(elem) {

    var lst = new Array();

    var rels = buscarRelaciones(elem.element);

    for (var i = 0; i < rels.length; i++) {
        lst.push(rels[i].refA.nombre);
    }

    return lst;
}
function buildContextMenuBasedOnSelItem() {

    clsMenu();
    if (mySel instanceof Box2) {
        addStdOption("del", "Eliminar Elemento Seleccionado.");
    } else if (mySel instanceof Link) {
        addStdOption("del", "Eliminar Conector Seleccionado.");
        addSeparartor("1");
        if (expectResize != -1) {
            addStdOption("dbp", "Eliminar Punto de Corte.");
        } else {
            addStdOption("abp", "Agregar Punto de Corte.");
        }
    } else if (mySel instanceof TextBox) {



        for (var i = 0; i < mySel.words.length; i++) {
            addTextBox(mySel.words[i].title.nombre, "Editar " + mySel.words[i].title.nombre, mySel.words[i].text);
        }
        addSeparartor("1");
        if (mySel.parent instanceof FlowBox) {

            var ls = findAvailableElements(mySel.parent);

            for (var i = 0; i < ls.length; i++) {
                addStdOption("addt" + ls[i], "Agregar " + ls[i] + ".");
            }

        }
        addSeparartor("2");
        if (mySel.deletable == true) {
            addStdOption("delt", "Eliminar Elemento Seleccionado.");
        }



    } else if (mySel instanceof FlowBox) {

        var ls = findAvailableElements(mySel);

        for (var i = 0; i < ls.length; i++) {
            addStdOption("add" + ls[i], "Agregar " + ls[i] + ".");
        }

    } else {

        clsMenu();
    }
    rebuildctxmenu();
    expectResizeForMenu = expectResize;
}
function contextMenuCallback(cmd) {
    if (cmd == "del") {
        deleteSelItem();
    }
    else if (mySel instanceof Link) {
        if (cmd == "abp") {

            if (mySel instanceof Link) {
                mySel.addBendPoint(new point(mx, my));
                invalidate();
                mainDraw();
            }

        } else if (cmd == "dbp") {

            if (expectResizeForMenu > 1) {

                mySel.delBendPoint(expectResizeForMenu - 2);
                invalidate();
                mainDraw();
            }
        } else if (cmd == "del") {
            deleteSelItem();
        }
    }

    else if (mySel instanceof FlowBox) {

        var ls = findAvailableElements(mySel);
        for (var i = 0; i < ls.length; i++) {
            if (cmd == "add" + ls[i]) {
                addShapeFromElementId(ls[i], mySel);
            }
        }
    } else if (mySel instanceof TextBox) {

        if (cmd == "delt") {
            if (mySel.parent instanceof Box2) {
                var par = mySel.parent;
                par.delElement(mySel);
                rebuildLinear();

            } else {
                var par = mySel.parent;

                par.removeChild(mySel);
                rebuildLinear();

            }
            invalidate();
            mainDraw();

        }
        if (mySel.parent instanceof FlowBox) {
            var ls = findAvailableElements(mySel.parent);
            for (var i = 0; i < ls.length; i++) {
                if (cmd == "addt" + ls[i]) {
                    addShapeFromElementId(ls[i], mySel.parent);
                }
            }
        }

    }



}

function addShapeFromElementId(id, parent) {

    var xmlDoc;


    if (window.DOMParser) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(descriptorString, "text/xml");
    }
    else // Internet Explorer
    {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(descriptorString);
    }

    descriptorLoad = true;
    var LOP = xmlDoc.getElementsByTagName("descriptor");
    var totalPersons = LOP.length;
    //console.log("Total no of Elems DESCRIPTOR: " + totalPersons);


    var chld = LOP[0].childNodes;
    //console.log("Total no of Elems Shape: " + chld.length);
    var rect = {};

    for (var i = 0; i < chld.length; i++) {


        if (chld[i].nodeName == "shape") {

            if (chld[i].attributes.getNamedItem("id").value == id) {
                //console.log("===>" + chld[i].attributes.getNamedItem("id").value + " - " + id);
                invalidate();
                //console.log("||" + chld[i].attributes.getNamedItem("type").value);
                if (chld[i].attributes.getNamedItem("type").value == "box2") {
                    //console.log("entr");
                    var shap = new Box2().toObject(chld[i], rect);
                    addElement(shap);
                    mySel = shap;


                } else if (chld[i].attributes.getNamedItem("type").value == "link") {

                    var shap = new Link().toObject(chld[i], rect);
                    addElement(shap);
                    mySel = shap;
                } else if (chld[i].attributes.getNamedItem("type").value == "flowbox") {
                    if (parent != null) {
                        var shap = new FlowBox().toObject(chld[i], parent);
                        parent.childsElements.push(shap);
                        mySel = shap;
                    }

                } else if (chld[i].attributes.getNamedItem("type").value == "textbox") {
                    if (parent != null) {
                        var shap = new TextBox().toObject(chld[i], parent);
                        parent.childsElements.push(shap);
                        mySel = shap;
                    }
                }
            }
        }
    }
    var eles = modelElements;

    descriptorLoad = false;
    mainDraw();
    rebuildLinear();
    addflag = false;


    /*var wds = new Array();
     
     wds.push(new Word(buscarClase("Classmate").getAtribute("name"), "int"));
     wds.push(new Word(buscarClase("Classmate").getAtribute("atributo1"), "78"));
     wds.push(new Word(buscarClase("Classmate").getAtribute("atributo2"), "55"));
     
     addText(actualId, buscarClase("Classmate"), "px+4", "py+4", "pw-8", "(ph/9)-8", 'rgba(0,0,0,0.7)', null, "pw-8", "(ph/9)-8", "px+4", "py+4", parent, wds, "CENTER", true, "12px Arial", true);
     */

}
function contextMenuTextCallback(cmd, value) {


    if (mySel instanceof TextBox) {

        for (var i = 0; i < mySel.words.length; i++) {
            if (mySel.words[i].title.nombre == cmd) {
                mySel.words[i].text = value;
            }
        }
        invalidate();
        mainDraw();
    }

}



// px,py,pw,ph,x,y,w,h,cx,cy,cw,ch
function textualCalculator(elem, expr) {

    //console.log("XP-->" + expr);
    if (elem.parent != null) {
        expr = expr.replace(/px/g, "" + elem.parent.x);

        expr = expr.replace(/py/g, "" + elem.parent.y);
        expr = expr.replace(/pw/g, "" + elem.parent.w);
        expr = expr.replace(/ph/g, "" + elem.parent.h);

        expr = expr.replace(/sx/g, "" + elem.x);
        expr = expr.replace(/sy/g, "" + elem.y);
        expr = expr.replace(/sw/g, "" + elem.w);
        expr = expr.replace(/sh/g, "" + elem.h);
        expr = expr.replace(/mx/g, "" + mx);
        expr = expr.replace(/my/g, "" + my);
    } else {
        expr = expr.replace(/px/g, "" + 0);

        expr = expr.replace(/py/g, "" + 0);
        expr = expr.replace(/pw/g, "" + 0);
        expr = expr.replace(/ph/g, "" + 0);

        expr = expr.replace(/sx/g, "" + elem.x);
        expr = expr.replace(/sy/g, "" + elem.y);
        expr = expr.replace(/sw/g, "" + elem.w);
        expr = expr.replace(/sh/g, "" + elem.h);
        expr = expr.replace(/mx/g, "" + mx);
        expr = expr.replace(/my/g, "" + my);
    }
    //alert("<<"+expr);
    return eval(expr);
}
function validateRelation(source, dest) {



    if (source instanceof Box2) {
        var relac = buscarRelacion(source.element, dest.element);
        if (relac != null) {
            ////console.log("--NC.:"+source.element.nombre+" - " +dest.element.nombre);
            return relac;
        }
        //////console.log("--NOPASA:"+relac.nombre);
        return null;
    } else if (source instanceof Link) {
        if (expectResize == 0) {

            if (source.p1rel.isInListOfRels(dest.element.nombre) != null) {
                ////console.log("--1");
                //console.log("--N.:" + source.element.nombre + " - " + dest.element.nombre);
                return source.p1rel.isInListOfRels(dest.element.nombre).refA;
            }

        } else if (expectResize == 1) {

            if (source.p2rel.isInListOfRels(dest.element.nombre) != null) {
                ////console.log("--2");
                //console.log("--N.:" + source.element.nombre + " - " + dest.element.nombre);
                return source.p2rel.isInListOfRels(dest.element.nombre).refA;
            }
        }
        return null;

    }

}

function loadDescriptor(filebox) {
    var fileToLoad = filebox.files[0];

    var fileReader = new FileReader();

    fileReader.onload = function(fileLoadedEvent) {


        descriptorString = fileLoadedEvent.target.result.toString();
        loadPalette(fileLoadedEvent.target.result.toString());

    };
    fileReader.readAsText(fileToLoad, "UTF-8");


}
function loadPalette(descriptorr) {
    var xmlDoc;


    if (window.DOMParser) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(descriptorr, "text/xml");
    }
    else // Internet Explorer
    {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(descriptorr);
    }


    var LOP = xmlDoc.getElementsByTagName("palette");
    var totalPersons = LOP.length;
    //console.log("Total no of Elems PALETTE: " + totalPersons);


    var chld = LOP[0].childNodes;
    htmlPalette = "";
    for (var i = 0; i < chld.length; i++) {
        if (chld[i].nodeName == "tool") {
            htmlPalette += "  <div id=\"" + chld[i].attributes.getNamedItem("name").value + "\" onmouseover=\"this.style.background = 'lightgray';" +
                    "this.style.cursor = 'pointer';\"" +
                    "onmouseout=\"this.style.background = 'white'\" onclick=\"addItem('" + chld[i].attributes.getNamedItem("elementId").value + "');" +
                    "document.getElementById('canvas2').style.cursor = 'crosshair';\"" +
                    "type=\"button\" width=\"250\" height=\"20\">" +
                    "<img src=\"" + chld[i].attributes.getNamedItem("thumbnail").value + "\" width=\"20\" height=\"20\">" +
                    chld[i].attributes.getNamedItem("name").value + "</div>" +
                    "<br>";
        }
    }
    //console.log(htmlPalette);
    createPalette(htmlPalette);
}

function validateRelMultiplicity(source) {
    var invalidItems = new Array();
    var relac = new Array();
    relac = buscarRelaciones(source.element);
    ////console.log("-->"+relac.length);
    if (relac.length == 0) {
        return null;
    }
    if (source instanceof Box2) {

        var res = true;
        for (var i = 0; i < relac.length; i++) {
            var count = 0;
            for (var j = 0; j < source.childsElements.length; j++) {

                if (source.childsElements[j] instanceof FlowBox) {
                    ////console.log("Centra");

                    for (var k = 0; k < source.childsElements[j].childsElements.length; k++) {

                        if (relac[i].refA.nombre == source.childsElements[j].childsElements[k].element.nombre) {

                            count++;
                        }
                    }

                }

                if (relac[i].refA.nombre == source.childsElements[j].element.nombre) {
                    count++;
                }


            }
            ////console.log("CT: "+count);

            if ((relac[i].maximos < count && relac[i].maximos != -1) || relac[i].minimos > count) {

                res = false;
                invalidItems.push(relac[i]);
            }



        }


        if (!res) {
            return invalidItems;
        }
        return null;
    } else {
        return null;

    }
}
var savestr = "";
function persistModel() {
    var str = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><model actualId=\"" + actualId + "\" modelname=\"" + modelname + "\" h=\"" + getCanvasH() + "\" w=\"" + getCanvasW() + "\"> ";
    for (var i = 0; i < modelElements.length; i++) {

        str += modelElements[i].persistString() + " ";

    }
    str += "</model>";
    return str;
}
function xmiModel() {
    var str = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<" + getEcoreName() + ":Model xmi:version=\"" + getEcoreXmiVersion() + "\" xmlns:xmi=\"" + getEcoreXmlnsXmi() + "\" xmlns:xsi=\"" + getEcoreXmlnsXsi() + "\" xmlns:" + getEcoreName() + "=\""+getEcorensUri()+"\" xsi:schemaLocation=\"" + getEcorensUri() + " " + getEcoreName() + ".ecore\">";

    for (var i = 0; i < modelElementsLinear.length; i++) {
        if (modelElementsLinear[i] instanceof Box2 || modelElementsLinear[i] instanceof Link) {
            str += modelElementsLinear[i].xmiString() + "\n";
        } else if (modelElementsLinear[i] instanceof TextBox) {
            if (modelElementsLinear[i].parent instanceof FlowBox) {
                str += modelElementsLinear[i].xmiString() + "\n";
            }
        }
    }

    str += "\n</" + getEcoreName() + ":Model>";
    return str;
}
function loadFileModel(filebox)
{
    var fileToLoad = filebox.files[0];

    var fileReader = new FileReader();

    fileReader.onload = function(fileLoadedEvent) {


        loadModel(fileLoadedEvent.target.result.toString());


    };
    fileReader.readAsText(fileToLoad, "UTF-8");

    var int = setInterval(function() {
        invalidate();
        mainDraw();
        clearInterval(int);
        buildPropModel();
        alert("Modelo cargado con exito");

    }, 1000);




}


function loadModel(filename) {
    var xmlDoc;
    mmstring = filename;
    clearModel();
    if (window.DOMParser) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(filename, "text/xml");
    }
    else // Internet Explorer
    {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(filename);
    }


    var LOP = xmlDoc.getElementsByTagName("model");
    var totalPersons = LOP.length;
    //console.log("Total no of Elems: " + totalPersons);


    actualId = parseInt(LOP[0].getAttribute("actualId"));
    modelname = LOP[0].getAttribute("modelname");
    canvas.width = LOP[0].getAttribute("w");
    canvas.height = LOP[0].getAttribute("h");


    var chld = LOP[0].childNodes;
    //console.log("Total no of Elems Shape: " + chld.length);
    var rect = {};

    for (var i = 0; i < chld.length; i++) {


        if (chld[i].nodeName == "shape") {
            //console.log("T->" + chld[i].nodeName + ", " + chld[i].attributes.getNamedItem("type").value);
            if (chld[i].attributes.getNamedItem("type").value == "box2") {
                modelElements.push(new Box2().toObject(chld[i], rect));
            } else if (chld[i].attributes.getNamedItem("type").value == "link") {
                rebuildLinear();
                modelElements.push(new Link().toObject(chld[i], rect));
            } else if (chld[i].attributes.getNamedItem("type").value == "flowbox") {
                modelElements.childsElements.push(new FlowBox().toObject(chld[i], rect));

            } else if (chld[i].attributes.getNamedItem("type").value == "textbox") {
                modelElements.push(new TextBox().toObject(chld[i], rect));
            }
        }
    }
    loadModelOptions();
    rebuildLinear();

    drawOverview();


}
function generateErrorLog() {
    var rsp = "";
    var err = 0;
    if (mySel == null) {
        for (var i = 0; i < modelElementsLinear.length; i++) {
            if (modelElementsLinear[i] instanceof Box2 || modelElementsLinear[i] instanceof Link || modelElementsLinear[i] instanceof TextBox) {
                if (!modelElementsLinear[i].valid) {
                    rsp += modelElementsLinear[i].validmessage + "<br>";
                    err++;
                }
            }
        }
    } else {

        if (mySel instanceof FlowBox) {

            rsp = "<font color=\"green\">Selección Actual:<b>" + mySel.parent.element.nombre + "(" + mySel.parent.id + ").</b></font><br>"
            for (var i = 0; i < modelElementsLinear.length; i++) {
                if (modelElementsLinear[i] instanceof Box2 || modelElementsLinear[i] instanceof Link || modelElementsLinear[i] instanceof TextBox) {
                    if (!modelElementsLinear[i].valid && modelElementsLinear[i] == mySel.parent) {
                        rsp += modelElementsLinear[i].validmessage + "<br>";
                        err++;
                    }
                }
            }
        } else {
            rsp = "<font color=\"green\">Selección Actual:<b>" + mySel.element.nombre + "(" + mySel.id + ").</b></font><br>"
            for (var i = 0; i < modelElementsLinear.length; i++) {
                if (modelElementsLinear[i] instanceof Box2 || modelElementsLinear[i] instanceof Link || modelElementsLinear[i] instanceof TextBox) {
                    if (!modelElementsLinear[i].valid && modelElementsLinear[i] == mySel) {
                        rsp += modelElementsLinear[i].validmessage + "<br>";
                        err++;
                    }
                }
            }
        }
    }
    refreshLog(rsp, err);

}


function loadXml(xmlStr) {
    var xmlDoc;
    mmstring = filename;
    if (window.DOMParser) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(filename, "text/xml");
    }
    else // Internet Explorer
    {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(filename);
    }


    return xmlDoc;
}