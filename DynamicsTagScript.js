function startPCA(executionContext, accountCode) {

    /* Clear out any events prior for continual field search.*/
    if(window.parent.pca && window.parent.pca.platform && window.parent.pca.platform.continualFieldSearches){
        var keys = Object.keys(window.parent.pca.platform.continualFieldSearches);
        for(var k = 0; k < keys; k++){
            var key = keys[k];
            if(window.parent.pca.platform.continualFieldSearches.hasOwnProperty(key)){
                clearInterval(window.parent.pca.platform.continualFieldSearches[key]);
            }
        }
    }

    /* Null out the pca context, it was created in a different parent context and we get "script freed" error.*/
    window.parent.pca = null;

    /* Our tag setup. */
    (function (n, t, i, r) {
        var u, f;
        n[i] = n[i] || {},
            n[i].initial = {
                accountCode: accountCode,
                host: accountCode + ".pcapredict.com"
            },
            n[i].on = n[i].on || function () {
                (n[i].onq = n[i].onq || []).push(arguments)
            },
            u = t.createElement("script"),
            u.async = !0,
            u.src = r,
            f = t.getElementsByTagName("script")[0],
            f.parentNode.insertBefore(u, f)
    })(window.parent, window.parent.document, "pca", "//" + accountCode + ".pcapredict.com/js/sensor.js");

    /* Upon fetching the data we can check our bindings which should now have a found DOM element attached to them can be updated now through the Xrm attribute.*/
    window.parent.pca.on("data", function (type, id, data) {
        switch (type) {
            case "address":
                for (var b = 0; b < window.parent.pca.platform.productList[id].PLATFORM_CAPTUREPLUS.bindings.length; b++) {
                    
                    /* This is what we could say is our proxy middle layer. Normally we can just populate the dom element, but this does not work.*/
                    /* We need to set the value through the Xrm sdk.*/

                    var binding = window.parent.pca.platform.productList[id].PLATFORM_CAPTUREPLUS.bindings[b];

                    /* Blur will trigger unfocused event. */
                    /* These element properties should be set earlier when we get the mappings come down in the "fields" event. */
                    for (var f = 0; f < binding.fields.length; f++) {
                        var field = binding.fields[f];
                        if (field.element && typeof(field.element) == "object"){
                            field.element.blur();
                        }
                    }

                    /* We can take each field and set the value of the related attribute that was found at the same time as the dom element above.*/
                    setTimeout(function () {
                    
                        for (var f = 0; f < binding.fields.length; f++) {
                            var field = binding.fields[f];
                            if (field.attribute) {
                                field.attribute.setValue(window.parent.pca.formatLine(data, field.field));
                                field.attribute.setSubmitMode("always"); // Readonly fields populated.
                            }
                        }
                    }, 100);

                }

                break;
        }
    });

    /* Find the element in the DOM */
    window.parent.pca.dynamicsElement = function (field) {
        var queries = [
            '[attrname="' + field + '"]',
            'input[data-id^="' + field + '"]',
            'textarea[data-id^="' + field + '"]',
            'select[data-id^="' + field + '"]',
            'input[id*="' + field + '"]',
            'textarea[id*="' + field + '"]',
            'select[id*="' + field + '"]'
        ];
        for (var q = 0; q < queries.length; q++) {
            query = queries[q];
            var elements = window.parent.document.querySelectorAll(query);
            for (var e = 0; e < elements.length; e++) {
                var element = elements[e];
                if (element) {
                    return element;
                }
            }
        }
        return null;
    }

    /* This is where we bridge the element name we have with the actual element in the DOM and the Xrm attribute. */
    window.parent.pca.on("fields", function (type, id, fields) {

        for (var f = 0; f < fields.length; f++) {

            var field = fields[f];

            if (!field.attribute) {

                field.originalId = JSON.parse(JSON.stringify(field.element));

                var formContext = executionContext.getFormContext();
                field.attribute = formContext.getAttribute(field.element);

                var element = window.parent.pca.dynamicsElement(field.element);

                field.element = element ? element : field.element;
            }
        }
    });

    /* Restrictions are a good way to check for existence of fields and let the 'continuous field search' continue. */
    window.parent.pca.on("restrictions", function (type, id, restrictions) {

        for (var r = 0; r < restrictions.length; r++) {

            if (restrictions[r].Key == "fieldPresent") {

                /* The override function will get discovered when checking the restrictions in setting up the services.*/
                /* In the sensor.js it checks restrictions which will call this override.*/
                /* If it passes then continual field search will stop.*/
                /* This is why we need to make sure here that any Xrm elements found are also visually found by the native browser controls.*/
                restrictions[r].override = function (r) {
                    
                    var formContext = executionContext.getFormContext();

                    /* This will only work for standard attributes. */
                    /* When it comes to composite address fields we need to fetch the composite field first.*/
                    var attrRef = r.Value;

                    var attr = formContext.ui.controls.get(attrRef);
                    
                    var composite = null;

                    if (attrRef.indexOf("address1") > -1){
                        composite = formContext.ui.controls.get("address1_composite");
                    }
                    else if (attrRef.indexOf("address2") > -1){
                        composite = formContext.ui.controls.get("address2_composite");
                    }
                    else if (attrRef.indexOf("address3") > -1){
                        composite = formContext.ui.controls.get("address3_composite");
                    }

                    var dom = window.parent.pca.dynamicsElement(attrRef);

                    var compositeUci = null;

                    /* In the unified interface the composite fields split out into separate fields, but they do not revert back to the original values you might expect! */
                    /* The resulting attribute id you need looks something like this : address1_composite_compositionLinkControl_address1_line1 */
                    /* If we have not found the attribute from the Xrm then try this below. The check for Uci is an internal function and so not supported by Dynamics, but while it's here it helps reduce code execution. */
                    if (Xrm.Internal.isUci() && (!attr && !composite))
                    {
                        if (attrRef.indexOf("address1") > -1){
                            compositeUci = formContext.ui.controls.get("address1_composite_compositionLinkControl_" + attrRef);
                        }
                        else if (attrRef.indexOf("address2") > -1){
                            compositeUci = formContext.ui.controls.get("address2_composite_compositionLinkControl_" + attrRef);
                        }
                        else if (attrRef.indexOf("address3") > -1){
                            compositeUci = formContext.ui.controls.get("address3_composite_compositionLinkControl_" + attrRef);
                        }
                    }

                    /* Do we have the element in the xrm (normal or composite) and do we have the element in the visual tree.*/
                    return (attr || composite || compositeUci) && dom;
                }
            }
        }
    });

    /* Once loaded, add some events to help with key enters */
    window.parent.pca.on("load", function (type, id, control) {

        console.log('pca load');

        /* We do this so that when someone is using the keyboard to drill-down into results, we keep focus on the capture control. */
        function smashEnterKey(event) {
            var keyNum = window.event ? window.event.keyCode : event.which;

            if (keyNum == 13 && (control.autocomplete.visible || control.countrylist.autocomplete.visible))
            {
                window.parent.pca.smash(event);
            }
        }
        window.parent.pca.listen(window.parent.document, "keydown", smashEnterKey, true);

        /* These keep the capture control from jumping to the corner of the view when drilling down the result. */

        window.parent.pca.listen(control.autocomplete.element, "click", window.parent.pca.smash);
        window.parent.pca.listen(control.countrylist.autocomplete.element, "click", window.parent.pca.smash);

        window.parent.pca.listen(control.autocomplete.element, "mousedown", window.parent.pca.smash);
        window.parent.pca.listen(control.countrylist.autocomplete.element, "mousedown", window.parent.pca.smash);
    });
}
