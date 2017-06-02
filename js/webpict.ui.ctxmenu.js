function rebuildctxmenu(){
   
$(function() {
    $.contextMenu({
        selector: '#container2',
        build: function($trigger, e) {
            return {
                callback: function(key, options) {
                    contextMenuCallback(key);
                },
                items: men
            };
        }
    });
});
}


var idx = 1;
var men = {};


function addTextBox(id,title, valuet) {
	
	var txt = {id: id, name: title,type:"text",value:valuet,className: ""+id};
	txt["events"] = {
                    keyup: function(e) {
						
                        contextMenuTextCallback(id,e.data.inputs[""+id].$input.val()) ;
						
						
                    }
					
					
                };
    men["" + id] = txt;
}
function addStdOption(id, title) {
    men["" + id] = { name: title};
}
function addSeparartor(id) {
    men["sep" + id] = "---------";
}


function clsMenu() {

    men = null;
     men={};
    
}


