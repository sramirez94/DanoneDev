({
    clearAddressList: function (component) {
        console.log("Clearing the list!");
        component.set('v.searchKey', null)
        component.set('v.AddressList', null);
    },
    saveAddressDetails: function (component,event) {
        component.set("v.errorMesage",null);
        var id = component.get("v.recordId");
        var action = component.get("c.saveAddressDetailsbyId");
        var addressDetails = component.get("v.addressDetails");
        console.log('id is ' + id);
        if(!addressDetails.Name){
            component.set("v.errorMesage", "Se debe ingresar como mínimo un dato en en campo 'Calle' para guardar la dirección");
        }else{
            var cuenta = component.get("v.cuenta");
            console.log('cuenta is ' + cuenta);
            if(cuenta){
                component.set("v.recordId",cuenta.Id);
            } 
            if(!id && cuenta){
                id = cuenta.Id;
            }                        
            component.set("v.showSpinner",true); 
            
            action.setParams({
                id: id,
                addDetails: component.get("v.addressDetails")
            });
            action.setCallback(this, function (response) {
                var state = response.getState();
                component.set("v.showSpinner",false);
                console.log('state is ' + state);
                if (state == 'SUCCESS') {
                    var respuesta = response.getReturnValue();
                    this.showToastMessage('¡Se ha creado la dirección de manera exitosa!', 'dismissible','success','Success!',event );
                    var isCalledFromOrder = component.get("v.isCalledFromOrder");
                    if(isCalledFromOrder){
                        var compEvent = component.getEvent("send_Addres_Details");
                        // set the Selected sObject Record to the event attribute.  
                        compEvent.setParams({"addressObj" : respuesta });  
                        // fire the event  
                        compEvent.fire();
                    }else{
                        $A.get('e.force:refreshView').fire();
                        var navEvt = $A.get("e.force:navigateToSObject");
                        navEvt.setParams({
                            "recordId": respuesta.Id,
                            "slideDevName": "detail",
                            "isredirect" :true
                        });
                        navEvt.fire();
                    }
                    
                }else if (state === "INCOMPLETE") {
                    // do something
                }
                    else if (state === "ERROR") {
                        var errors = response.getError();
                        if (errors) {
                            if (errors[0] && errors[0].message) {
                                console.log("Error message: " + 
                                            errors[0].message);
                                component.set("v.errorMesage", "'Error al crear la dirección: "+errors[0].message);
                                this.showToastMessage('Error al crear la dirección: '+errors[0].message, 'sticky','error','Warning!',event );
                            }
                        } else {
                            console.log("Unknown error");
                        }
                    }
            });                        
            $A.enqueueAction(action);
        }
        
    },
    //get address details from salesforce DB
    getAddressDetails: function (component) {
        console.log('Method ');
        component.set('v.mapMarkers', [{
            location: {
                latitude: 19.3841106,
                longitude: -99.1465449
            },
        }]);
        component.set('v.zoomLevel', 16);
        var id = component.get("v.recordId");
        component.set("v.showSpinner",true);
        var action = component.get("c.getAddressDetailsbyId");
        var oR;
        action.setParams({
            id: id
        });
        
        action.setCallback(this, function (response) {
            component.set("v.showSpinner",false);
            var state = response.getState();
            console.log('state: ' + state);
            console.log('Data - ' + JSON.stringify(response.getReturnValue()));
            if (state == 'SUCCESS') {
                var re = JSON.stringify(response.getReturnValue());
                console.log('Respuesta Exitosa...');
                //console.log(response.getReturnValue());
                component.set("v.addressDetails", response.getReturnValue());
                oR = component.get("v.addressDetails");
                console.log('oR Lat:' + oR.Latitud__c);
                console.log('oR Long:' + oR.Longitud__c);
                component.set('v.mapMarkers', [{
                    location: {
                        Latitude: oR.Latitud__c,
                        Longitude: oR.Longitud__c
                    },
                }]);
                component.set('v.zoomLevel', 16);
            }
        });                
        $A.enqueueAction(action);
    },
    //get address details by place Id from google API 
    getAddressDetailsByPlaceId: function (component, event) {
        var selectedValue = event.currentTarget.dataset.value;
        component.set("v.showSpinner",true);
        var action = component.get("c.getAddressDetailsByPlaceId");
        var postalCode = '',
            state = '',
            country = '',
            city = '',
            street = '',
            street_number = '',
            route = '',
            subLocal1 = '',
            subLocal2 = '',
            latitud = '',
            longitud = '';
        
        action.setParams({
            PlaceID: selectedValue
        });
        action.setCallback(this, function (response) {
            component.set("v.showSpinner",false);
            var res = response.getState();
            if (res == 'SUCCESS') {
                //console.log(response.getReturnValue());
                var response = JSON.parse(response.getReturnValue());
                
                var FieldLabel = response.result.geometry.location;
                latitud = FieldLabel.lat;
                longitud = FieldLabel.lng;
                console.log('latitud: ' + latitud);
                console.log('longitud: ' + longitud);
                
                component.set('v.mapMarkers', [{
                    location: {
                        Latitude: latitud,
                        Longitude: longitud
                    },
                }]);
                component.set('v.zoomLevel', 16);
                for (var i = 0; i < response.result.address_components.length; i++) {
                    FieldLabel = response.result.address_components[i].types[0];
                    //console.log(FieldLabel);
                    //debugger;
                    if (FieldLabel == 'sublocality_level_2' || FieldLabel == 'sublocality_level_1' || FieldLabel == 'street_number' || FieldLabel == 'route' || FieldLabel == 'locality' || FieldLabel == 'country' || FieldLabel == 'postal_code' || FieldLabel == 'administrative_area_level_1') {
                        switch (FieldLabel) {
                            case 'sublocality_level_2':
                                subLocal2 = response.result.address_components[i].long_name;
                                break;
                            case 'sublocality_level_1':
                                subLocal1 = response.result.address_components[i].long_name;
                                break;
                            case 'street_number':
                                street_number = response.result.address_components[i].long_name;
                                break;
                            case 'route':
                                route = response.result.address_components[i].long_name;
                                break;
                            case 'postal_code':
                                postalCode = response.result.address_components[i].long_name;
                                break;
                            case 'administrative_area_level_1':
                                state = response.result.address_components[i].long_name;
                                break;
                            case 'country':
                                country = response.result.address_components[i].long_name;
                                break;
                            case 'locality':
                                city = response.result.address_components[i].long_name;
                                break;
                            default:
                                break;
                        }
                    }
                }
                
                street = route;
                if (street == null) {
                    street = subLocal2 + ' ' + subLocal1;
                }
                console.log(street);
                console.log(street_number);
                component.set('v.addressDetails.Name', street);
                component.set('v.addressDetails.codigoPostal__c', postalCode);
                component.set('v.addressDetails.estadoProvincia__c', state);
                component.set('v.addressDetails.Pais__c', country);
                component.set('v.addressDetails.Ciudad__c', city);
                component.set('v.addressDetails.numeroExterior__c', street_number);
                component.set('v.addressDetails.ubicacion__Latitude__s', latitud);
                component.set('v.addressDetails.ubicacion__Longitude__s', longitud);
                
                
                
                component.set("v.searchKey", null);
                component.set("v.showModalBox", false);
                console.log('Fin de la rutina...');
            }
        });
        $A.enqueueAction(action);
    },
    getAddressRecommendations: function (component, event) {
        var key = component.get("v.searchKey");
        component.set("v.showSpinner",true);
        var action = component.get("c.getAddressSet");
        action.setParams({
            "SearchText": key
        });
        
        action.setCallback(this, function (response) {
            component.set("v.showSpinner",false);
            var state = response.getState();
            if (state === "SUCCESS") {
                var response = JSON.parse(response.getReturnValue());
                var predictions = response.predictions;
                var addresses = [];
                if (predictions.length > 0) {
                    for (var i = 0; i < predictions.length; i++) {
                        var bc = [];
                        addresses.push({
                            main_text: predictions[i].structured_formatting.main_text,
                            secondary_text: predictions[i].structured_formatting.secondary_text,
                            place_id: predictions[i].place_id
                        });
                        
                    }
                }
                for (var i = 0; i < addresses.length; i++) {
                    console.log(addresses[i].main_text);
                    console.log(addresses[i].secondary_text);
                    console.log(addresses[i].place_id);
                }
                component.set("v.AddressList", addresses);
            }
        });
        $A.enqueueAction(action);
    },
    
    showToastMessage : function(mssg, mode, type, title, event) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            mode: mode,
            message: mssg,
            type : type,
            title : title
        });
        toastEvent.fire();
    }
})
