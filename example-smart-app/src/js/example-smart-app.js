function Deferred() {
	// update 062115 for typeof
	if (typeof (Promise) != 'undefined' && Promise.defer) {
		//need import of Promise.jsm for example: Cu.import('resource:/gree/modules/Promise.jsm');
		return Promise.defer();
	} else if (typeof (PromiseUtils) != 'undefined' && PromiseUtils.defer) {
		//need import of PromiseUtils.jsm for example: Cu.import('resource:/gree/modules/PromiseUtils.jsm');
		return PromiseUtils.defer();
	} else {
		/* A method to 
		the associated Promise with the value passed.
		 * If the promise is already settled it does nothing.
		 *
		 * @param {anything} value : This value is used to resolve the promise
		 * If the value is a Promise then the associated promise assumes the state
		 * of Promise passed as value.
		 */
		this.resolve = null;

		/* A method to reject the assocaited Promise with the value passed.
		 * If the promise is already settled it does nothing.
		 *
		 * @param {anything} reason: The reason for the rejection of the Promise.
		 * Generally its an Error object. If however a Promise is passed, then the Promise
		 * itself will be the reason for rejection no matter the state of the Promise.
		 */
		this.reject = null;

		/* A newly created Promise object.
		 * Initially in pending state.
		 */
		this.promise = new Promise(function (resolve, reject) {
			this.resolve = resolve;
			this.reject = reject;
		}.bind(this));
		Object.freeze(this);
	}
}

var b64 = '';

(function (window) {
	window.extractData = function () {
		debugger;
		var ret = new Deferred();
		var input = document.getElementById('consentFile');


		input.onchange = function () {
			var name = input.files[0].name;
			var file = input.files[0],
				reader = new FileReader();

			reader.onloadend = function () {
				// Since it contains the Data URI, we should remove the prefix and keep only Base64 string
				b64 = reader.result.replace(/^data:.+;base64,/, '');
				//Now add the send document link
				document.getElementById("calljs").disabled = false;

			};

			reader.readAsDataURL(file);
		};
		function onError() {

			console.log('Loading error', arguments);
			ret.reject();
		}


		function onReady(smart) {

			if (smart.hasOwnProperty('patient')) {
				var patient = smart.patient;
				var pt = patient.read();
				var practitionerID = smart.state.tokenResponse.user;
				// temporary hard code practitioner ID
				var practitionerCall = 'Practitioner/11817978';
				var us = smart.request(practitionerCall);		//get({resource:"Practitioner", id:practitionerID});//user.read();
				//	var us = smart.request(`Practitioner/${smart.state.tokenResponse.user}`);
				var en = smart.request(`Encounter/${smart.state.tokenResponse.encounter}`);
				//var en = smart.encounter.read();//smart.get({resource:"Encounter",id:smart.state.tokenResponse.encounter}); 
				console.log(smart);

				var p = defaultInfo();

				p.encounterId = smart.state.tokenResponse.encounter;
				p.noteCode = 'Depending on consent type';
				p.noteSystem = 'https://fhir-ehr.sandboxcerner.com/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/codeset/72';
				p.uName = smart.state.tokenResponse.username;
				p.uId = smart.state.tokenResponse.user;

				pt.then((patient) => {

					// Patient Stuff
					console.log(patient);

					var edipiSysId = "urn:oid:2.16.840.1.113883.3.42.10001.100001.12";
					var edipi = 'Not Defined';


					if (patient.hasOwnProperty('identifier')) {
						var identifiers = patient.identifier;
						var edipiList = identifiers.filter(function (el) { return el.system == edipiSysId });
						console.log(edipiList);
						if (edipiList.length > 0) {
							edipi = edipiList[0].value;
						}
					}
					p.edipi = edipi;
					if (patient.hasOwnProperty('text')) {
						p.info = patient.text.div;
					}
					p.id = patient.id;

				});

				us.then((user) => {
					// User (Practitioner) Stuff
					console.log(user);
					var stationId = 'Undefined';
					var email = 'Undefined';

					if (user.hasOwnProperty('telecom')) {
						var emailList = user.telecom.filter(function (el) { return el.system == "email" });
						if (emailList.length > 0) {
							email = emailList[0].value;
						}
					}
					// Need to get station Id here
					if (user.hasOwnProperty('identifier')) {
						var userIdentifiers = user.identifier.filter(function (el) { return el.type.text = "OTHER" })
						stationId = userIdentifiers[0].value;
					}
					p.stationId = stationId;
					p.email = email;

				});

				en.then((encounter) => {
					// use encounter information here. 
					console.log(encounter);
				})
				
					Promise.allSettled([us, pt, en]).then((results) => ret.resolve([p, smart]));
				});

			} else {
				onError();
			}
		}

		FHIR.oauth2.ready(onReady, onError);
		// FHIR.oauth2.ready().then(onReady).catch(onError);;ds
		return ret.promise;

	};

	function getDocument(data) {
		var startDate = new Date();
		startDate.setMinutes(startDate.getMinutes() - 50);
		debugger;
		return {
			resourceType: "DocumentReference",
			subject: {
				reference: `Patient/${data.id}`
			},
			type: {
				coding: [{ system: "http://loinc.org", code: "34839-1", display: 'SIC Consent Display Text' }]
			},
			text: 'SIC Testing in Text Field',
			status: 'current',
			docStatus: 'final',
			author: [{ reference: 'Practitioner/12742069' }],
			content: [
				{
					attachment:
					{
						contentType: 'application/pdf',
						data: b64,
						creation: new Date(),
						title: 'SIC Consent attachment title'
					}

				}
			],
			context: {
				encounter: [{ reference: `Encounter/${data.encounterId}` }],
				period: { start: startDate.toISOString(), end: new Date().toISOString() }
			}
		};
	}


	function defaultInfo() {
		return {
			id: { value: '' },
			stationId: { value: '' },
			email: { value: '' },
			info: { value: '' },
			uId: { value: '' },
			uName: { value: '' },
			encounterId: { value: '' },
			edipi: { value: '' },
			noteCode: { value: '' },
			noteSystem: { value: '' }
		};
	}

	function 
		if ((b64.length) < 2) {
			alert('Please select a file before trying to send');
			return;
		}
		var doc = getDocument(data);
		console.log(JSON.stringify(doc));
		//	smart.request();
		$('#getPDF').empty();
		$('#docStatus').html('<p>Sending Document</p>');
		
	
		debugger;
		var cr = smart.create(doc)
		cr.then(response => {
			console.log(response);
			debugger;
			// Get the document reference object 
			var loc = response.headers.map.location.split('/');
			var docId = loc[loc.length - 1];
			var docRef = smart.request(`DocumentReference/${docId}`);
			docRef.then(docResponse => {
				debugger;
				// get the binary now 
				console.log(docResponse);
				$('#docStatus').html('<p>Sent</p>');
				var binaryUrl = docResponse.content[0].attachment.url;
				var binary = binaryUrl.split("/");
				var binaryId = binary[binary.length - 1];

				var accessToken = smart.state.tokenResponse.access_token;
				var binRequest = new XMLHttpRequest();
				binRequest.open("Get", binaryUrl);
				binRequest.setRequestHeader("accept", "application/json+fhir");
				binRequest.setRequestHeader("Authorization", `Bearer ${accessToken}`);
				$('#getPDF').html('<p>Fetching Document</p>');
				binRequest.onreadystatechange = function () {
					if (this.readyState == 4 && this.status == 200) {
						debugger;
						var binResponse = this.responseText;
						console.log(binResponse);

						var link = document.createElement('a');
						link.innerHTML = 'Download PDF file';
						link.download = binaryId + '.pdf';
						link.href = 'data:application/octet-stream;base64,' + JSON.parse(binResponse).data;
						$('#getPDF').empty();
						$("#getPDF").append(link);
					}
				};
				binRequest.send();
			});
		});
	}

	function getBinaryContent(url, smart) {
		var accessToken = smart.state.tokenResponse.access_token;
		var binRequest = new XMLHttpRequest();
		binRequest.open("Get", url);
		binRequest.setRequestHeader("accept", "application/json+fhir");
		binRequest.setRequestHeader("Authorization", `Bearer ${accessToken}`);
		binRequest.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				var binResponse = this.responseText;
				console.log(binResponse);
			}
		};
		binRequest.send();
	}
	function getBinaryFromClient(url, smart) {
		var binary = url.split("/");
		var binaryId = binary[binary.length - 1];
		var binaryDoc = smart.request(`Binary/${binaryId}`);
		binaryDoc.then(binaryResonse => {
			console.log(binaryResponse);
		});
	}
	window.drawVisualization = function (p, client) {
		$('#holder').show();
		$('#loading').hide();
		$('#id').html(p.id);
		$('#edipi').html(p.edipi);
		$('#userEmail').html(p.email);
		$('#stationId').html(p.stationId);
		$('#info').html(p.info);
		$('#userid').html(p.uId);
		$('#userName').html(p.uName);
		$('#encounterId').html(p.encounterId);
		$('#noteCode').html(p.noteCode);
		$('#notesystem').html(p.noteSystem);
		$("#calljs").click(function (e) {
			e.preventDefault();
			sendDocument(p, client);
		});
		document.getElementById("calljs").disabled = true;
	};

})(window);
