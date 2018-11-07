function startPCA(accountCode){
    
window.parent.pca = null;

(function(n,t,i,r){var u,f;n[i]=n[i]||{},n[i].initial={accountCode:accountCode,host:accountCode + ".pcapredict.com"},n[i].on=n[i].on||function(){(n[i].onq=n[i].onq||[]).push(arguments)},u=t.createElement("script"),u.async=!0,u.src=r,f=t.getElementsByTagName("script")[0],f.parentNode.insertBefore(u,f)})(window.parent,window.parent.document,"pca","//" + accountCode + ".pcapredict.com/js/sensor.js");

var main = window.parent.document;
var pca  = window.parent.pca;

pca.on("data", function(type, id, data){
    var pca = window.parent.pca;
    switch(type){
        case "address":
            for(var b = 0; b < pca.platform.productList[id].PLATFORM_CAPTUREPLUS.bindings.length; b++){
                var binding = pca.platform.productList[id].PLATFORM_CAPTUREPLUS.bindings[b];

                for(var f = 0; f < binding.fields.length; f++){
                    var field = binding.fields[f];
                    field.element.blur();
                }

                setTimeout(function(){ 
                    for(var f = 0; f < binding.fields.length; f++){
                        var field = binding.fields[f];
                        field.attribute.setValue(pca.formatLine(data, field.field));
                    } 
                }, 100);
                
            }
            break;
    }    
 });

var fieldStateMonitors = {};

pca.dynamicsElementExists = function(field){
    var queries = [
        '[attrname="' + deHeaderify(field.originalId) + '"]',
        'input[data-id^="' + field.control._controlName + '"]',
        'textarea[data-id^="' + field.control._controlName + '"]',
        'select[data-id^="' + field.control._controlName + '"]',
        'input[data-id^="' + field.originalId + '"]',
        'textarea[data-id^="' + field.originalId + '"]',
        'select[data-id^="' + field.originalId + '"]'
    ];
    for(var q = 0; q < queries.length; q++){
        query = queries[q];
        var elements = main.querySelectorAll(query);
        for(var e = 0; e < elements.length; e++){
            var element = elements[e];
            if(element){
                if(field.originalId.indexOf("header_process_") == 0){
                    if(element.id.indexOf("header_process_") == 0){
                        return element;
                    }
                }else{
                    if(element.id.indexOf("header_process") == -1){
                        return element;
                    }
                }
            }
        }
    }
}

pca.on("fields", function(type, id, fields){
        for(var f = 0; f < fields.length; f++) {
            var field = fields[f],
            fieldId = field.element;
            if(!field.attribute){
                field.originalId = JSON.parse(JSON.stringify(fieldId));
                field.attribute = Xrm.Page.getAttribute(deHeaderify(fieldId));
                field.control = field.attribute ? field.attribute.controls.get(0) : null;
                field.element = pca.dynamicsElementExists(field);

                // fieldStateMonitors[field.originalId] = setInterval(function(){
                //     if(field.element !== pca.dynamicsElementExists(field)){
                //         field.element = pca.dynamicsElementExists(field);
                //         pca.load();
                //     }
                // }, 1000);
            }
        }

});

function deHeaderify(s){
    return s.replace("header_process_", "");
}

 pca.on("restrictions", function(type, id, restrictions){
    for(var r = 0; r< restrictions.length; r++){
        if(restrictions[r].Key == "fieldPresent"){
            restrictions[r].override = function(r){
                var attrRef = r.Value;
                var attr = Xrm.Page.getAttribute(deHeaderify(r.Value));
                return attr ? true : false;
            }
        }
    }
 });

 pca.on("load", function(type, id, control){
     console.log('pca load');
    function smashEnterKey(event) {
        var keyNum = window.event ? window.event.keyCode : event.which;

        if (keyNum == 13 && (control.autocomplete.visible || control.countrylist.autocomplete.visible))
            pca.smash(event);
    }

    pca.listen(main, "keydown", smashEnterKey, true);

    pca.listen(control.autocomplete.element, "click", pca.smash);
    pca.listen(control.countrylist.autocomplete.element, "click", pca.smash);

    pca.listen(control.autocomplete.element, "mousedown", pca.smash);
    pca.listen(control.countrylist.autocomplete.element, "mousedown", pca.smash);

    pca.listen(main, "click", function () {
        control.autocomplete.checkHide();
        control.countrylist.autocomplete.checkHide();
    });
 });
}
