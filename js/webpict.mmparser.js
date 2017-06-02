var clases;
var relaciones;
var mmstring;
var ecorename;
var xmiversion;
var xmlnsxmi;
var xmlnsxsi;
var nsURI;
function Clase() {
    this.nombre;
    this.atributos = new Array();
    this.atributoId;
    this.toString = function () {

        var str = this.nombre + " - ID: " + this.atributoId + "\n";
        for (var i = 0; i < this.atributos.length; i++) {
            str = str + "-->" + this.atributos[i].toString() + "\n";
        }
        return str;
    }
    this.getAtribute = function (name) {
        for (var i = 0; i < this.atributos.length; i++) {
            if (this.atributos[i].nombre == name) {
                return this.atributos[i];
            }
        }
        return null;
    }


}
function Atributo(nombren, tipon) {
    this.nombre = nombren;
    this.tipo = tipon;
    this.toString = function () {
        return this.nombre + ": " + this.tipo;

    }


}
function Relacion() {
    this.nombre;
    this.refA;
    this.oriref;
    this.maximos = -1;
    this.minimos = 0;
    this.toString = function () {
        return this.oriref.nombre + "----" + this.nombre + "----->" + this.refA.nombre + " || (" + this.maximos + ")-(" + this.minimos + ")";

    }
}
function destroyClickedElement(event) {
    document.body.removeChild(event.target);
}


function saveTextAsFile(filename, value) {
    var textToWrite = value;
    var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
    var fileNameToSaveAs = filename;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

function buscarRelacion(source, destination) {
    for (var i = 0; i < relaciones.length; i++) {
        if (relaciones[i].refA.nombre == destination.nombre && relaciones[i].oriref.nombre == source.nombre) {
            return relaciones[i];
        }
    }
    return null;
}
function buscarRelaciones(source) {
    var lst = new Array();
    for (var i = 0; i < relaciones.length; i++) {
        if (relaciones[i].oriref.nombre == source.nombre) {
            lst.push(relaciones[i]);
        }
    }
    return lst;
}

function buscarRelacionN(source, destination) {
    for (var i = 0; i < relaciones.length; i++) {
        if (relaciones[i].refA.nombre == destination && relaciones[i].oriref.nombre == source) {
            return relaciones[i];
        }
    }
    return null;
}

function buscarRelacionId(id) {
    for (var i = 0; i < relaciones.length; i++) {
        if (relaciones[i].nombre == id) {
            return relaciones[i];
        }
    }
    return null;
}

function loadMetamodel(filebox) {
    var fileToLoad = filebox.files[0];

    var fileReader = new FileReader();

    fileReader.onload = function (fileLoadedEvent) {


        procesarEcore(fileLoadedEvent.target.result.toString());


    };
    fileReader.readAsText(fileToLoad, "UTF-8");


}

function getXMIRelationName(elename){
    var xf = buscarRelaciones(buscarClase("Model"));
    for(var i=0;i<xf.length;i++){
        if(elename == xf[i].refA.nombre){
            return xf[i].nombre;
        }
    }
    return "undefined";
}



function buscarClase(nombre) {
    for (var k = 0; k < clases.length; k++) {
        if (clases[k].nombre == nombre) {
            return clases[k];
        }

    }
    return new Clase();
}
function getEcoreName(){
    return ecorename;
}
function getEcoreXmiVersion(){
    return xmiversion;
}
function getEcoreXmlnsXmi(){
    return xmlnsxmi;
}
function getEcoreXmlnsXsi(){
    return xmlnsxsi;
}
function getEcorensUri(){
    return nsURI;
}
function procesarEcore(filename) {
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
    var LOP1 = xmlDoc.getElementsByTagName("ecore:EPackage");
    
 
  
    ecorename = LOP1[0].getAttribute("name");
    xmiversion = LOP1[0].getAttribute("xmlns:xmi");
    xmlnsxmi= LOP1[0].getAttribute("xmi:version");
    xmlnsxsi = LOP1[0].getAttribute("xmlns:xsi");
    nsURI = LOP1[0].getAttribute("nsURI");
   
    console.log(LOP1[0].getAttribute("name"));

    var LOP = xmlDoc.getElementsByTagName("eClassifiers");
    var totalPersons = LOP.length;
    console.log("Total no of Elems: " + totalPersons);
    clases = new Array();
    relaciones = new Array();

    for (var i = 0; i < LOP.length; i++) {

        console.log(LOP[i].getAttribute("name"));

        var rt = new Clase();
        rt.nombre = LOP[i].getAttribute("name")
        clases.push(rt);

    }


    for (var i = 0; i < LOP.length; i++) {


        var ch = LOP[i].childNodes;

        var atrArray = new Array();

        for (var j = 0; j < ch.length; j++) {
            try {

                if (ch[j].attributes.getNamedItem("xsi:type").value == "ecore:EAttribute") {
                    atrArray.push(new Atributo(ch[j].attributes.getNamedItem("name").value, ch[j].attributes.getNamedItem("eType").value.split("/")[ch[j].attributes.getNamedItem("eType").value.split("/").length - 1]));
                    try {
                        if (ch[j].attributes.getNamedItem("iD").value == "true") {
                            buscarClase(LOP[i].getAttribute("name")).atributoId = ch[j].attributes.getNamedItem("name").value;
                        }
                    }
                    catch (err) {

                    }

                } else if (ch[j].attributes.getNamedItem("xsi:type").value == "ecore:EReference") {

                    var nr = new Relacion();

                    nr.nombre = ch[j].attributes.getNamedItem("name").value;

                    nr.oriref = buscarClase(LOP[i].getAttribute("name"));

                    nr.refA = buscarClase(ch[j].attributes.getNamedItem("eType").value.split("/")[ch[j].attributes.getNamedItem("eType").value.split("/").length - 1]);
                    relaciones.push(nr);

                    try {
                        nr.maximos = ch[j].attributes.getNamedItem("upperBound").value;

                    } catch (err) {

                    }
                    try {
                        nr.minimos = ch[j].attributes.getNamedItem("lowerBound").value;

                    } catch (err) {

                    }

                }
            } catch (err) {

            }
        }
        buscarClase(LOP[i].getAttribute("name")).atributos = atrArray;

    }

    console.log("CLASES: " + clases.length);
    for (var i = 0; i < clases.length; i++) {
        console.log(clases[i].toString());
    }

    console.log("RELACIONES: " + relaciones.length);
    for (var i = 0; i < relaciones.length; i++) {
        console.log(relaciones[i].toString());
    }

}



function loadMetamodel(filebox) {
    var fileToLoad = filebox.files[0];

    var fileReader = new FileReader();

    fileReader.onload = function (fileLoadedEvent) {


        procesarEcore(fileLoadedEvent.target.result.toString());


    };
    fileReader.readAsText(fileToLoad, "UTF-8");


}


function buscarClase(nombre) {
    for (var k = 0; k < clases.length; k++) {
        if (clases[k].nombre == nombre) {
            return clases[k];
        }

    }
    return new Clase();
}



function validateValueType(type, value) {

    if (type == "EString") {
        //console.log("->outstr");
        return true;
    } else if (type == "ELong") {
        //console.log("->outlong");
        try {

            return value.match(/^[0-9]+$/) != null;
        } catch (e) {
            return false;
        }
    } else if (type == "EInt") {
        //console.log("->outint");
        try {

            return value.match(/^[0-9]+$/) != null;
        } catch (e) {
            return false;
        }
    } else if (type == "EDouble") {
        //console.log("->outdouble");
        try {

            return value.match(/^[0-9]+$/) != null;
        } catch (e) {
            return false;
        }
    } else if (type == "EBoolean") {
        //console.log("->outbool");
        try {

            return value == "true" || value == "false" ? true : false;
        } catch (e) {
            return false;
        }
    } else {
        //console.log("->out");
        return true;
    }
}