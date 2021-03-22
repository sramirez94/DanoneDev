/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 08-03-2020
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 * Modifications Log 
 * Ver   Date         Author                               Modification
 * 1.0   07-30-2020   ChangeMeIn@UserSettingsUnder.SFDoc   Initial Version
**/
public class AddressSearchController {
    
    //Method to get address details in the initial load
    @AuraEnabled
    public static Direccion__c getAddressDetailsbyId(String id){
        Direccion__c ad = new Direccion__c();
        for (Direccion__c  d : [select Id, Ciudad__c, estadoProvincia__c, Pais__c, numeroExterior__c, codigoPostal__c,ubicacion__Latitude__s,ubicacion__Longitude__s, Name, latitud__c, longitud__c,instruccionesEntrega__c, entreCalle1__c, entreCalle2__c from Direccion__c where id =: id]){
            ad = d;
        }
        return ad;
    }
    //Method to save address details on click on Save button
    @AuraEnabled
    public static Direccion__c saveAddressDetailsbyId(String id, Direccion__c addDetails){
        system.debug('saveAddressDetailsbyId method');
        system.debug('addDetails ' + addDetails);
        system.debug('id '+ id);
        /*Decimal decLatitud = addDetails.ubicacion__Latitude__s;
        Decimal decLongitud = addDetails.ubicacion__Longitude__s;*/
        Direccion__c d = new Direccion__c();
        d.Cuenta__c = id;
        d.Ciudad__c = addDetails.Ciudad__c;
        d.estadoProvincia__c = addDetails.estadoProvincia__c;
        d.Pais__c = addDetails.Pais__c;
        d.codigoPostal__c = addDetails.codigoPostal__c;
        d.Name = addDetails.Name;
        d.numeroExterior__c = addDetails.numeroExterior__c;
        //d.latitud__c = String.valueOf(addDetails.latitud__c);
        //d.longitud__c = String.valueOf(addDetails.longitud__c);
        d.instruccionesEntrega__c = addDetails.instruccionesEntrega__c;
        d.entreCalle1__c = addDetails.entreCalle1__c;
       	d.entreCalle2__c = addDetails.entreCalle2__c;
        d.numeroInterior__c = addDetails.numeroInterior__c;
        d.ubicacion__Latitude__s = addDetails.ubicacion__Latitude__s;
        d.ubicacion__Longitude__s = addDetails.ubicacion__Longitude__s;
        System.debug('Direccion Save: ' + addDetails);
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(Label.Endpoint_By_Address);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('client_secret', Label.Client_Secret);
        request.setHeader('client_id', Label.Client_Id);
        
        JSONGenerator gen = JSON.createGenerator(true);    
        gen.writeStartObject();      
        gen.writeStringField('street', d.Name +' '+d.numeroExterior__c);
        gen.writeStringField('route', d.Name);
        gen.writeStringField('county', d.estadoProvincia__c);
        gen.writeStringField('city', d.Ciudad__c);
        gen.writeStringField('zip_code', d.codigoPostal__c);
        gen.writeEndObject();    
        String jsonS = gen.getAsString();

        System.debug('json:' + jsonS);
       
        request.setBody(jsonS);
        HttpResponse response = http.send(request);
        
        if (response.getStatusCode() != 200) {
            System.debug('The status code returned was not expected: ' +
                response.getStatusCode() + ' ' + response.getStatus());
                throw new AuraHandledException('Error al normalizar la dirección The status code returned was not expected: ' +
                response.getStatusCode() + ' ' + response.getStatus());
        } else {
            System.debug(response.getBody());
            fromJSON c = (fromJSON)JSON.deserializeStrict(response.getBody(),fromJSON.class);
            
            if (c.success == 'true') {
                try {
                    if(c.load_address!= null) d.Delegacion__c = c.load_address.municipality;
                for(cls_results item : c.geocoding.results){
                    if(item.geometry != null){
                        if(item.geometry.location != null) d.Ubicacion__latitude__s = Decimal.valueOf(item.geometry.location.lat);
                        if(item.geometry.location != null) d.ubicacion__Longitude__s = Decimal.valueOf(item.geometry.location.lng);
                    }
                    if(item.address_components != null){
                        for(cls_address_components subItem : item.address_components){
                            if(subItem.types.contains('street_number')) d.numeroExterior__c = subItem.long_name;
                            if(subItem.types.contains('route')) d.Name = subItem.long_name;
                            if(subItem.types.contains('sublocality_level_1')) d.Colonia__c = subItem.long_name;
                            if(subItem.types.contains('locality')) d.estadoProvincia__c = subItem.long_name;
                            if(subItem.types.contains('administrative_area_level_1')) d.estadoProvincia__c = subItem.long_name;
                            if(subItem.types.contains('country')) d.Pais__c = subItem.long_name;
                            if(subItem.types.contains('postal_code')) d.codigoPostal__c = subItem.long_name;
                        }
                    }
                }
                if(d.Pais__c == 'Mexico') d.Pais__c='MXN';
                /*if(d.estadoProvincia__c == 'Ciudad de México') d.estadoProvincia__c = 'Ciudad de Mexico';
                    if(ObtieneFrecuencias(d.Ubicacion__latitude__s, d.ubicacion__Longitude__s))
                        system.debug('Obtuvo latitud y longitud');
                    else System.debug('no pudo obtenerlo');*/
                insert d;
                } catch (Exception ex) {
                    System.debug('Error al guardar la dirección '+ex.getMessage()+' '+ex.getLineNumber());
                    throw new AuraHandledException('Error al guardar la dirección '+ex.getMessage());
                    
                }

                return d;
            }else{
                
                throw new AuraHandledException('Error al normalizar la dirección: '+c.geocoding.status);
            }
            
        }

       
    }
    
    //Method to call google API and fetch the address recommendations 
    @AuraEnabled
    public static String getAddressSet(String SearchText){
        String APIKey = 'AIzaSyB0hRspH2GVlLTYxN6sorjRrST7BK7zAhE';
        String result = null;
        system.debug('SearchText is ' + SearchText);
        try{
            if(SearchText != null){
                String APIUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' + SearchText.replace(' ', '%20') + '&key=' + APIKey; 
                system.debug('APIUrl is ' + APIUrl);
                HttpRequest req = new HttpRequest();
                req.setMethod('GET');
                req.setEndpoint(APIURL);
                Http http = new Http();
                HttpResponse res = http.send(req);
                Integer statusCode = res.getStatusCode();
                system.debug('statusCode is ' + statusCode);
                if(statusCode == 200){
                    system.debug('API invoked successfully');
                    result = res.getBody();
                }
            }
        }
        catch(exception e){
            //Handling exception
            system.debug(e.getMessage());
        }
        return result;
    }
    
    //Method to call google API and fetch the address details by addressID 
    @AuraEnabled
    public static String getAddressDetailsByPlaceId(String PlaceID){
        String APIKey = 'AIzaSyB0hRspH2GVlLTYxN6sorjRrST7BK7zAhE';
        String result = null;
        system.debug('SearchText is ' + PlaceID);
        try{
            if(PlaceID != null){
                String APIUrl = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + PlaceId.replace(' ', '%20') + '&key=' + APIKey; 
                system.debug('APIUrl is ' + APIUrl);
                HttpRequest req = new HttpRequest();
                req.setMethod('GET');
                req.setEndpoint(APIURL);
                Http http = new Http();
                HttpResponse res = http.send(req);
                Integer statusCode = res.getStatusCode();
                system.debug('statusCode is ' + statusCode);
                if(statusCode == 200){
                    system.debug('API invoked successfully');
                    result = res.getBody();
                }
            }
        }
        catch(exception e){
            //Handling exception
            system.debug(e.getMessage());
        }
        return result;
    }
    @AuraEnabled
    public static Direccion__c getAddressRecord(String recordId){
        Direccion__c addDetails = [SELECT Id, Name, Colonia__c, numeroExterior__c, numeroInterior__c,ubicacion__Longitude__s,ubicacion__Latitude__s, codigoPostal__c, Pais__c, estadoProvincia__c, Latitud__c, Longitud__c, Ciudad__c, Delegacion__c FROM Direccion__c WHERE Id=:recordId];

        Direccion__c d = new Direccion__c();
        d.Id = addDetails.Id;
        d.Ciudad__c = addDetails.Ciudad__c;
        d.estadoProvincia__c = addDetails.estadoProvincia__c;
        d.Pais__c = addDetails.Pais__c;
        d.codigoPostal__c = addDetails.codigoPostal__c;
        d.Name = addDetails.Name;
        d.numeroExterior__c = addDetails.numeroExterior__c;
        d.ubicacion__Latitude__s = addDetails.ubicacion__Latitude__s;
        d.ubicacion__Longitude__s = addDetails.ubicacion__Longitude__s;
        d.numeroInterior__c = addDetails.numeroInterior__c;
        //d.ubicacion__Latitude__s = Decimal.valueOf(addDetails.latitud__c);
        //d.ubicacion__Longitude__s = Decimal.valueOf(addDetails.longitud__c);
        System.debug('Direccion Save: ' + addDetails);
        
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(Label.Endpoint_By_Address);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('client_secret', Label.Client_Secret);
        request.setHeader('client_id', Label.Client_Id);
        
        JSONGenerator gen = JSON.createGenerator(true);    
        gen.writeStartObject();      
        gen.writeStringField('street', d.Name +' '+d.numeroExterior__c);
        String colonia = d.Colonia__c != null ? d.Colonia__c : '';
        String estado = d.estadoProvincia__c != null ? d.estadoProvincia__c : '';
        String ciudad = d.Ciudad__c != null ? d.Ciudad__c : '';
        String cp = d.codigoPostal__c != null ? d.codigoPostal__c : '';
        gen.writeStringField('route', colonia);
        gen.writeStringField('county', estado);
        gen.writeStringField('city', ciudad);
        gen.writeStringField('zip_code', cp);
        gen.writeEndObject();    
        String jsonS = gen.getAsString();

        System.debug('json:' + jsonS);
       
        request.setBody(jsonS);
        HttpResponse response = http.send(request);
        
        if (response.getStatusCode() != 200) {
            System.debug('The status code returned was not expected: ' +
                response.getStatusCode() + ' ' + response.getStatus());
                throw new AuraHandledException('Error al normalizar la dirección The status code returned was not expected: ' +
                response.getStatusCode() + ' ' + response.getStatus());
        } else {
            System.debug(response.getBody());
            fromJSON c = (fromJSON)JSON.deserializeStrict(response.getBody(),fromJSON.class);
            
            if (c.success == 'true') {
                try {
                    if(c.load_address!= null) d.Delegacion__c = c.load_address.municipality;
                    
                for(cls_results item : c.geocoding.results){
                    if(item.geometry != null){
                        if(item.geometry.location != null) d.ubicacion__Latitude__s = Decimal.valueOf(item.geometry.location.lat);
                        if(item.geometry.location != null) d.ubicacion__Longitude__s = Decimal.valueOf(item.geometry.location.lng);
                    }
                    if(item.address_components != null){
                        for(cls_address_components subItem : item.address_components){
                            if(subItem.types.contains('street_number')) d.numeroExterior__c = subItem.long_name;
                            if(subItem.types.contains('route')) d.Name = subItem.long_name;
                            if(subItem.types.contains('sublocality_level_1')) d.Colonia__c = subItem.long_name;
                            if(subItem.types.contains('locality')) d.estadoProvincia__c = subItem.long_name;
                            if(subItem.types.contains('administrative_area_level_1')) d.estadoProvincia__c = subItem.long_name;
                            if(subItem.types.contains('country')) d.Pais__c = subItem.long_name;
                            if(subItem.types.contains('postal_code')) d.codigoPostal__c = subItem.long_name;
                        }
                    }
                }
                } catch (Exception ex) {
                    System.debug('Error al guardar la dirección '+ex.getMessage()+' '+ex.getLineNumber());
                    throw new AuraHandledException('Error al guardar la dirección '+ex.getMessage());
                    
                }
                

                return d;
            }else{
                
                throw new AuraHandledException('Error al normalizar la dirección: '+c.geocoding.status);
            }
            
        }

       
        
    }

    @AuraEnabled
    public static string saveAddressRecord(Direccion__c direccion){
        if(direccion.Pais__c == 'Mexico') direccion.Pais__c='MXN';
        if(direccion.estadoProvincia__c == 'Ciudad de México') direccion.estadoProvincia__c = 'Ciudad de Mexico';
        if(direccion.estadoProvincia__c == 'State of Mexico') direccion.estadoProvincia__c = 'Estado de Mexico';
        if(direccion.estadoProvincia__c == 'Estado de México') direccion.estadoProvincia__c = 'Estado de Mexico';
        try {update direccion;} catch (Exception ex){throw new AuraHandledException(ex.getMessage());}
        
        return direccion.Id;
    }
    @auraEnabled
    public static String ObtieneFrecuencias(Id idDireccion){
        //Boolean result = false;
        System.debug('ObtieneFrecuencias');
        try{
            Direccion__c d = [Select Id, Longitud__c,ubicacion__Latitude__s,ubicacion__Longitude__s, Latitud__c,Canal__c From Direccion__c Where ID=:idDireccion];
            if(d.ubicacion__Latitude__s == null || d.ubicacion__Longitude__s == null){
                throw new AuraHandledException('La dirección no contiene información suficiente, favor de revisar la latitud y longitud de la misma');
            }else{
                System.debug('1');
                HttpRequest request = new HttpRequest();
                Http http = new Http();
                System.debug('2');
                request.setEndpoint(Label.Endpoint_By_GPS);
                request.setMethod('POST');
                request.setHeader('Content-Type', 'application/json');
                request.setHeader('client_secret', Label.Client_Secret);
                request.setHeader('client_id', Label.Client_Id);
                System.debug('3');
                JSONGenerator gen=JSON.createGenerator(true);
                gen.writeStartObject();      
                gen.writeStringField('latitude', String.valueOf(d.ubicacion__Latitude__s));
                gen.writeStringField('longitude', String.valueOf(d.ubicacion__Longitude__s));
                System.debug('4');
                //gen.writeStringField('chanel', String.valueOf(d.Canal__c));
                gen.writeEndObject();    
                String jsonS = gen.getAsString();
                System.debug('5');
                System.debug('json:' + jsonS);
                request.setBody(jsonS);
                System.debug('6');
                HttpResponse response = http.send(request);
                System.debug('7');
                if (response.getStatusCode() != 200) {
                    //result = false;
                    throw new AuraHandledException('Error al obtener los datos de cobertura ' + response.getStatusCode() + ' ' + response.getStatus());
                } else {
                    /*JSON2Apex m = JSON2Apex.parse(response.getBody());
                    System.debug('respuesta frec: ' + m);
                    result = true;*/
                    System.debug('body: ' + response.getBody());
                }
                System.debug('8');
                //return result;
                return response.getBody();
                //return 'Proceso final';
            }
        }catch (Exception ex){
            System.debug('ObtieneFrecuencias: ' +ex.getMessage()+' '+ex.getLineNumber());
            throw new AuraHandledException('ObtieneFrecuencias: ' +ex.getMessage()+' '+ex.getLineNumber());
            
        }
    }
    public class fromJSON{
        public cls_error_list[] error_list;
        public cls_geocoding geocoding;
        public cls_load_address load_address;
        public String message;    //
        public String success;
       
    }//true
    public class cls_error_list{
        public String code;    //
        public String message;    //
        public String technical_messages;    //
       
    }
    public class cls_geocoding {
        public cls_results[] results;
        public String status;    //OK
    }
    public class cls_results {
        public cls_address_components[] address_components;
        public String formatted_address;    //Tajín 251, Narvarte Oriente, Benito Juárez, 03020 Ciudad de México, CDMX, Mexico
        public cls_geometry geometry;
        public String place_id;    //ChIJz3eqNwT_0YUREoAPgW9aGQU
        public cls_plus_code plus_code;
        public String[] types;
    }
    public class cls_address_components {
        public String long_name;    //251
        public String short_name;    //251
        public String[] types;
    }
   
    public class cls_geometry {
        public cls_bounds bounds;
        public cls_location location;
        public String location_type;    //ROOFTOP
        public cls_viewport viewport;
    }
    public class cls_bounds {
       	public cls_location northeast;
        public cls_location southwest;
    }
    public class cls_location {
        public String lat;    //19.3924446
        public String lng;    //-99.15341
    }
    public class cls_viewport {
        public cls_northeast northeast;
        public cls_southwest southwest;
    }
    public class cls_northeast {
        public String lat;    //19.3937931
        public String lng;    //-99.15206
    }
    public class cls_southwest {
        public String lat;    //19.3910961
        public String lng;    //-99.15476
    }
    public class cls_plus_code {
        public String compound_code;    //9RRW+XJ Mexico City, CDMX, Mexico
        public String global_code;    //76F29RRW+XJ
    }
    public class cls_load_address {
        public String city;    //Ciudad de México
        public String city_code;    //03
        public String load_address_identifier;    //0
        public cls_load_source_identifier load_source_identifier;
        public String municipality;    //Benito Juárez
        public String municipality_code;    //014
        public String office_zip_c;    //03001
        public String state;    //Ciudad de México
        public String state_code;    //09
        public String township;    //Narvarte Oriente
        public String township_identifier;    //2623
        public String township_type;    //Colonia
        public String township_type_code;    //09
        public String township_zip_d;    //03001
        public String zip;    //03023
        public String zip_c;    //
        public String zone_type;    //Urbano
    }
    public class cls_load_source_identifier{   
    }
}
