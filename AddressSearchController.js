({
  //Show the modal window on click in the input field
  OpenModal: function (component, event, helper) {
    component.set("v.AddressList", null);
    component.set("v.showModalBox", true);
  },
  //close the modal window on click of cancel button
  closeModal: function (component, event, helper) {
    component.set("v.showModalBox", false);
  },
  //Clear the address list on the user interface
  clear: function (component, event, helper) {
    helper.clearAddressList(component, event);
  },
  //get address details in the initital load of the component
  doInit: function (component, event, helper) {
    var pageRef = component.get("v.pageReference");
    if(pageRef){
      var state = pageRef.state; // state holds any query params
    var base64Context = state.inContextOfRef;
    /*
        *For some reason, the string starts with "1.", if somebody knows why,
        *this solution could be better generalized.
    */
      if (base64Context.startsWith("1\.")) {
        base64Context = base64Context.substring(2);
    }
    var addressableContext = JSON.parse(window.atob(base64Context));
    component.set("v.recordId", addressableContext.attributes.recordId);
    console.log("Init method execution");
    console.log(component.get("v.recordId"));            
    }
    helper.getAddressDetails(component);      
  },
  //Save address when user click on save button in the component
  saveAdress: function (component, event, helper) {
    console.log("On click of save button!");      
    helper.saveAddressDetails(component,event);
    //this.getAddressByGPS(component, event);
  },
  //Get city, state, country and other details from selected address
  selectOption: function (component, event, helper) {
    helper.getAddressDetailsByPlaceId(component, event);
  },
  //On search of address get address list from the API
  keyPressController: function (component, event, helper) {
    helper.getAddressRecommendations(component, event);
  },
  loadOptionsTipo: function (component, event, helper) {
    component.set("v.loaded", false);
    var action = component.get("c.RetornaOpciones");
    action.setParams({
        Type:'Tipo'
    });
    action.setCallback(this, function(response){
        var state = response.getState();
        if (state === "SUCCESS") {                               
            var result = response.getReturnValue();
            var MapaTipo = [];
            for(var key in result){
                MapaTipo.push({key: key, value: result[key]});
            }
            component.set("v.TipoMap", MapaTipo);                               
        }
    });
    component.set("v.loaded", true);
    $A.enqueueAction(action);
  },
  cancelDialog : function(component, helper) {
    var isCalledFromOrder= component.get("v.isCalledFromOrder");
    if(isCalledFromOrder){
      var compEvent = component.getEvent("Close_Modal_Address");
      // fire the event  
      compEvent.fire();
    }else{
      var recordId = component.get("v.recordId");
      if(recordId){
        var navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
          "recordId": recordId,
          "slideDevName": "related"
        });
        navEvt.fire();
      }else{
        var homeEvent = $A.get("e.force:navigateToObjectHome");
        homeEvent.setParams({
            "scope": "Direccion__c"
        });
        homeEvent.fire();
      }
    }
    
    
  }
});
