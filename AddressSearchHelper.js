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
        var Tipo = component.get("v.TipoSelected");
        console.log('id is ' + id);
        if(!addressDetails.Name){
            component.set("v.errorMesage", "Se debe ingresar como mínimo un dato en en campo 'Calle' para guardar la dirección");
        } else if(!Tipo){
            component.set("v.errorMesage", "Debe seleccionar un tipo de cobertura para poder obtener la misma");
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
                    this.showToastMessage('Buscando cobertura en la dirección', 'dismissible','success','Buscando cobertura',event );
                    var isCalledFromOrder = component.get("v.isCalledFromOrder");
                    if(isCalledFromOrder){
                        var compEvent = component.getEvent("send_Addres_Details");
                        // set the Selected sObject Record to the event attribute.  
                        compEvent.setParams({"addressObj" : respuesta });  
                        // fire the event  
                        compEvent.fire();
                    }else{
                        
                    }
                    this.getAddressByGPS(component,event,respuesta.Id, respuesta);
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
    getAddressByGPS : function(component, event, DireccionId, objRespuesta){
        console.log('getAddressByGPS');
        component.set("v.showSpinner",true);
        var direccion = objRespuesta;//component.get("v.addressDetails");
        var action = component.get("c.ObtieneFrecuencias");
        var Tipo = component.get("v.TipoSelected");
        console.log('asignó dirección y action');
        console.log('id dirección: ' + DireccionId);
        action.setParams({ idDireccion : DireccionId });
        var isCalledFromOrder = component.get("v.isCalledFromOrder");
        console.log('asigna parámetros');
        action.setCallback(this, function(response){
            console.log('ejecutó');
            var state = response.getState();
            console.log('estado: ' + state);
            if (state === "SUCCESS"){
                var objres = response.getReturnValue();
                var obj = JSON.parse(objres);
                console.log(obj);
                if(obj){
                    console.log('1');
                    component.set("v.responseData",obj);
                    if(obj.coverage){
                        console.log('2');
                        if(obj.coverage.coverage === 'true'){
                            direccion.Cobertura__c = true;
                            component.set("v.direccionActualizable",direccion);
                            component.set("v.isActive",false);
                            var action2 = component.get("c.saveAddressRecord");
                            action2.setParams({direccion : direccion});
                            action2.setCallback(this, function(response){
                                var state2 = response.getState();
                                if(state === 'SUCCESS'){
                                    console.log('exitoso');
                                    this.showToastMessage('¡La dirección cuenta con cobertura! Consulte los detalles de la cuenta', 'dismissible','success','Success!',event );
                                } else if (state === "ERROR"){
                                    var errors = response.getError();
                                    if (errors) {
                                        if (errors[0] && errors[0].message) {
                                            console.log("Error message: " +
                                            errors[0].message);
                                        } else {
                                            console.log("Unknown error");
                                        }
                                    }
                                }
                            });
                            $A.enqueueAction(action2);
                            /*console.log('3');
                            if(obj.customer_delivery_data){
                                console.log('4');
                                if(obj.customer_delivery_data.find(item => item.delivery_type == Tipo)){
                                    var item = obj.customer_delivery_data.find(item => item.delivery_type == Tipo);
                                    //var direccion = component.get("v.addressDetails");
                                    direccion.Cobertura__c = true;
                                    direccion.tipoCobertura__c = item.coverage_type;
                                    direccion.codigoZona__c = item.zone_code;
                                    direccion.codigoDistribuidora__c = item.distributor_code;
                                    direccion.codigoRuta__c = item.route_code;
                                    direccion.tipoEntrega__c = item.delivery_type;
                                    if(item.frequency){
                                        console.log('5');
                                        if(item.frequency.delivery_monday == "1"){
                                            direccion.Lunes__c = true;
                                        }
                                        if(item.frequency.delivery_tuesday == "1"){
                                            direccion.Martes__c = true;
                                        }
                                        if(item.frequency.delivery_wednesday == "1"){
                                            direccion.Miercoles__c = true;
                                        }
                                        if(item.frequency.delivery_thursday == "1"){
                                            direccion.Jueves__c = true;
                                        }
                                        if(item.frequency.delivery_friday == "1"){
                                            direccion.Viernes__c = true;
                                        }
                                        if(item.frequency.delivery_saturday == "1"){
                                            direccion.Sabado__c = true;
                                        }
                                        component.set("v.direccionActualizable",direccion);
                                        component.set("v.isActive",false);
                                        var action2 = component.get("c.saveAddressRecord");
                                        action2.setParams({direccion : direccion});
                                        action2.setCallback(this, function(response){
                                            var state2 = response.getState();
                                            if(state === 'SUCCESS'){
                                                console.log('exitoso');
                                                this.showToastMessage('¡La dirección cuenta con cobertura! Consulte los detalles de la cuenta', 'dismissible','success','Success!',event );
                                            } else if (state === "ERROR"){
                                                var errors = response.getError();
                                                if (errors) {
                                                    if (errors[0] && errors[0].message) {
                                                        console.log("Error message: " +
                                                        errors[0].message);
                                                    } else {
                                                        console.log("Unknown error");
                                                    }
                                                }
                                            }
                                        });
                                        $A.enqueueAction(action2);
                                    }
                                } else {
                                    this.showToastMessage('El tipo de cobertura no aplica para esta dirección', 'dismissible','error','Error al obtener cobertura',event );
                                }
                            }*/
                        } else {
                            this.showToastMessage('No se cuenta con cobertura para la dirección ingresada', 'dismissible','error','Error al obtener cobertura',event );
                        }
                    }
                }
            } else if (state === "ERROR"){
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " +
                        errors[0].message);
                    } else {
                        console.log("Unknown error");
                    }
                }
            }
            if(!isCalledFromOrder){
                //$A.get('e.force:refreshView').fire();
                setTimeout(function () {
                    component.set("v.showSpinner",false);
                    var navEvt = $A.get("e.force:navigateToSObject");
                    navEvt.setParams({
                        "recordId": DireccionId,
                        "slideDevName": "detail",
                        "isredirect" :true
                    });
                    navEvt.fire();
                }, 1000);
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
