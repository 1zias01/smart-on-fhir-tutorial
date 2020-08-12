(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {

      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
	    var user = smart.user;
		var us = smart.get({resource:"Practitioner", id:smart.tokenResponse.user });//user.read();

		console.log(smart);
		$.when(pt,us).fail(onError);

        $.when(pt,us).done(function(patient,user) {
         // var byCodes = smart.byCodes(obv, 'code');
          var p = defaultInfo();
		 
		 // User (Practitioner) Stuff
		  console.log(user);
		  var stationId='Pending';
	      var email = 'Undefined';

  		  var telecoms = user.telecom;
		  var emailList = user.telecom.filter(function (el) {return el.system=="email"});
          if (emailList.length>0) {
			  email = emailList[0].value;
		  }
		  // Need to get station Id here
		  p.stationId = stationId;
		  p.email = email;
		  
       // Patient Stuff
          var id = patient.id;
		  console.log(patient);
		  var uId = smart.tokenResponse.user;
		  var uName = smart.tokenResponse.username;
		  
		  var edipiSysId = "urn:oid:2.16.840.1.113883.3.42.10001.100001.12";
		  var identifiers = patient.identifier;
		  var edipiList = identifiers.filter(function (el) {return el.system==edipiSysId});
		  console.log(edipiList);
		  var edipi = 'Not Defined';
		  if (edipiList.length>0) {
			   edipi = edipiList[0].value;
		  }
          var info = '';
          p.id = patient.id;
          p.info = patient.text.div;
		  p.uName = uName;
		  p.uId = uId;
		  
          p.encounterId= smart.tokenResponse.encounter;
		  p.edipi = edipi;
		  p.noteCode = 'Depending on consent type';
		  p.noteSystem = 'To Be Defined by Cerner';
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };
  
  function defaultInfo(){
    return {
      id: {value: ''},
	  stationId: {value: ''},
	  email: {value: ''},
	  info: {value: ''},
	  uId: {value:''},
	  uName: {value:''},
	  encounterId: {value:''},
	  edipi: {value: ''},
	  noteCode: {value: ''},
	  noteSystem: {value: ''}
    };
  }


  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
	$('#id').html(p.id);
	$('#userEmail').html(p.email);
	$('#stationId').html(p.stationId);	
	$('#info').html(p.info);
	$('#userid').html(p.uId);
	$('#userName').html(p.uName);
	$('#encounterId').html(p.encounterId);
	$('#edipi').html(p.edipi);
	$('#noteCode').html(p.noteCode);
	$('#notesystem').html(p.noteSystem);
	
  };

})(window);
