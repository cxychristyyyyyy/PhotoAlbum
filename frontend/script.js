try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
 };


var recording = false;
var recognition;
var apigClient = apigClientFactory.newClient();


function audioProcessing(){
	document.getElementById('query').value = null;
	document.getElementById("searchResponse").innerHTML = null;
	let final_transcript = '';
	if (recording == false){
		recognition.start();
		recording = true;
  		console.log('Started voice recognition');
  		document.getElementById("microphone_icon").style.color = "rgba(217,37,37,1)"; // #d92525
  	 	recognition.onresult = function(event) {
	    	var interim_transcript = '';

	    	for (var i = event.resultIndex; i < event.results.length; ++i) {
		      if (event.results[i].isFinal) {
		        final_transcript += event.results[i][0].transcript;
		      } else {
		        interim_transcript += event.results[i][0].transcript;
		      }
		    }
		    recording = false;
		    console.log("Output:",final_transcript);
		    document.getElementById("displayImages").innerHTML = null;
  			document.getElementById("uploadResponse").innerHTML = null;
  			document.getElementById('query').value = final_transcript;
  			document.getElementById("microphone_icon").style.color = "";
		    searchImages(final_transcript);
		    console.log("Debug")
		}

		 recognition.onspeechend = function() {
		   //document.getElementById("searchResponse").innerHTML = 'You were quiet for a while so voice recognition turned itself off.';
                  document.getElementById("microphone_icon").style.color = "";
		 }

		recognition.onerror = function(event) {
		  if(event.error == 'no-speech') {
		    document.getElementById("searchResponse").innerHTML = 'No speech was detected. Try again.';
		    document.getElementById("microphone_icon").style.color = "";
		  };
    	}
    }
  	else{
  		recognition.stop();
  		document.getElementById("microphone_icon").style.color = "";
  		recording = false;
  	};
};
