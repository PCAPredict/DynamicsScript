function startPCA(executionContext, accountCode) {

    var formContext = executionContext.getFormContext();

    /* Clear out any events prior for continual field search.*/
    if (window.parent.pca && window.parent.pca.platform && window.parent.pca.platform.continualFieldSearches) {
        var keys = Object.keys(window.parent.pca.platform.continualFieldSearches);
        for (var k = 0; k < keys; k++) {
            var key = keys[k];
            if (window.parent.pca.platform.continualFieldSearches.hasOwnProperty(key)) {
                clearInterval(window.parent.pca.platform.continualFieldSearches[key]);
            }
        }
    }

    /* Null out the pca context, it was created in a different parent context and we get "script freed" error.*/
    window.parent.pca = null;

    var overideSetValue = setInterval(function () {

        if (window.parent.pca && window.parent.pca.tidy) {
            /* Define a custom version of the setValue so that we set it on the Xrm element attribute instead and let the toolkit update the view from the model. */
            window.parent.pca.setValue = function (element, value) {

                var valueText = value.toString();

                var tidyValue = window.parent.pca.tidy(valueText.replace(/\\n|\n/gi, ", "), ", ");

                var keys = Object.keys(window.parent.pca.platform.productList);

                for (var a = 0; a < keys.length; a++) {

                    if (window.parent.pca.platform.productList[keys[a]].PLATFORM_CAPTUREPLUS) {
                        for (var b = 0; b < window.parent.pca.platform.productList[keys[a]].PLATFORM_CAPTUREPLUS.bindings.length; b++) {

                            var bindings = window.parent.pca.platform.productList[keys[a]].PLATFORM_CAPTUREPLUS.bindings[b];

                            for (var f = 0; f < bindings.fields.length; f++) {

                                var field = bindings.fields[f];

                                if (field.element == element) {

                                    if (field.attribute) {

                                        field.attribute.setValue(tidyValue);
                                        field.attribute.setSubmitMode("always"); // Readonly fields populated.
                                    }
                                }
                            }
                        }
                    }
                }
            }

            console.log("Added Dynamics specific pca.setValue");
            clearInterval(overideSetValue);
        }
    }, 100);

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

                    /* This will only work for standard attributes. */
                    /* When it comes to composite address fields we need to fetch the composite field first.*/
                    var attrRef = r.Value;

                    var attr = formContext.ui.controls.get(attrRef);

                    var composite = null;

                    if (attrRef.indexOf("address1") > -1) {
                        composite = formContext.ui.controls.get("address1_composite");
                    }
                    else if (attrRef.indexOf("address2") > -1) {
                        composite = formContext.ui.controls.get("address2_composite");
                    }
                    else if (attrRef.indexOf("address3") > -1) {
                        composite = formContext.ui.controls.get("address3_composite");
                    }

                    var dom = window.parent.pca.dynamicsElement(attrRef);

                    var compositeUci = null;

                    /* In the unified interface the composite fields split out into separate fields, but they do not revert back to the original values you might expect! */
                    /* The resulting attribute id you need looks something like this : address1_composite_compositionLinkControl_address1_line1 */
                    /* If we have not found the attribute from the Xrm then try this below. The check for Uci is an internal function and so not supported by Dynamics, but while it's here it helps reduce code execution. */
                    if (Xrm.Internal.isUci() && (!attr && !composite)) {
                        if (attrRef.indexOf("address1") > -1) {
                            compositeUci = formContext.ui.controls.get("address1_composite_compositionLinkControl_" + attrRef);
                        }
                        else if (attrRef.indexOf("address2") > -1) {
                            compositeUci = formContext.ui.controls.get("address2_composite_compositionLinkControl_" + attrRef);
                        }
                        else if (attrRef.indexOf("address3") > -1) {
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

        control.listen("populate", function(address, variations) {
            clearAddressSearchField();
            /* Composite field in the non-unified view needs to update the label. */
            formContext.data.entity.save();
        });

        /* We do this so that when someone is using the keyboard to drill-down into results, we keep focus on the capture control. */
        window.parent.pca.listen(window.parent.document, "keydown", function (event) {
            var keyNum = window.event ? window.event.keyCode : event.which;

            if (keyNum == 13 && (control.autocomplete.visible || control.countrylist.autocomplete.visible)) {
                window.parent.pca.smash(event);
            }
        }, true);

        window.parent.pca.listen(control.autocomplete.element, "click", window.parent.pca.smash);
        
        window.parent.pca.listen(control.autocomplete.element, "mousedown", window.parent.pca.smash);

        window.parent.pca.listen(control.countrylist.autocomplete.element, "mousedown", window.parent.pca.smash);
    });
}

function clearAddressSearchField() {

    if (window.parent.pca && window.parent.pca.capturePlus && window.parent.pca.capturePlus.controls) {

        for (var c = 0; c < window.parent.pca.capturePlus.controls.length; c++) {

            var fields = window.parent.pca.capturePlus.controls[c].fields;

            for (var f = 0; f < fields.length; f++) {

                var field = fields[f];

                if (field && field.mode == 1) { 
                    field.attribute.setValue("");
                    field.element.value = "";
                    field.element.blur();
                }
            }
        }
    }
}