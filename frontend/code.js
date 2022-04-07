try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}

var recording = false;
var recognition;
var apigClient = apigClientFactory.newClient();
var name = '';
var encoded = null;
var fileExt = null;

window.onload = function() {
  document.getElementById('query').addEventListener("keydown", (e) => {
    if (e.keyCode === 13 && document.getElementById('query').value) {  //checks whether the pressed key is "Enter"
        submitSearch();
        e.preventDefault();
    }
  }, false);
}

function submitSearch(){
  query = document.getElementById('query').value
  document.getElementById("displayImages").innerHTML = null;
  document.getElementById("uploadResponse").innerHTML = null;
  document.getElementById("searchResponse").innerHTML = null;
  searchImages(query)
}

function searchImages(query){
  console.log("Searching images - " + query);
  if (query == ""){
    alert("Empty string provided to search");
  }
  else{
      var params = {
          "q": query
      };
      var additionalParams = {
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Access-Control-Allow-Origin,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',	
              'Access-Control-Allow-Credentials':	'true',	
              'Access-Control-Allow-Methods': 'GET,OPTIONS',
              'X-Api-Key': '****'
          }
      }
      var body = {};
      apigClient.searchGet(params, body, additionalParams).then(function (result) {
            console.log("in SearchGet");
            console.log(result);
            if (result.hasOwnProperty('errorMessage') || result['data']['body'] == ''){
                displayS3Images(null)
             }
            else{
                var img_list = result['data']['results']; 
                console.log("img_list is");
                console.log(img_list);
                console.log(img_list.length);
                displayS3Images(img_list);
            }
        }).catch(function(result){
            console.log('ERROR: Response failed - ' + result);
        });
      }
}


function displayS3Images(img_list) {
    console.log("in display");
    var displayImages = document.getElementById("displayImages");
    console.log("test1");
    if(img_list == null){
        console.log("test2");
        document.getElementById("displayImages").innerHTML = null;
        searchErrorResponse = document.getElementById("searchResponse");
        searchErrorResponse.innerHTML = "No images found";
    }
    else {
        var len = img_list.length;
        console.log(len);
        for (var i = 0, len = img_list.length; i < len; ++i) {
            var img = new Image();
            img.src = img_list[i]['url'];
            console.log(img.src);
            img.style.width = "200px";
            img.style.height = "200px";
            img.style.padding = "7px";
            img.style.border = "5px solid black";
            displayImages.appendChild(img);
        }
        console.log("fail");
    }
}


function previewFile(input) {
  document.getElementById("uploadResponse").innerHTML = null;
  document.getElementById("submit_upload_button").style.backgroundColor = "rgba(15, 137, 204, 1)";
  document.getElementById("submit_upload_button").style.color = "white";
  console.log("Inside preview")
  var reader = new FileReader();
  name = input.files[0].name;
  fileExt = name.split(".").pop();
  var onlyname = name.replace(/\.[^/.]+$/, "");
  var finalName = onlyname + "_" + Date.now() + "." + fileExt;
  name = finalName;

  reader.onload = function (e) {
    var src = e.target.result;
    var newImage = document.createElement("img");
    newImage.src = src;
    encoded = newImage.outerHTML;
  }
  reader.readAsDataURL(input.files[0]);
}

function uploadImage2(event) {
    document.getElementById("submit_upload_button").style.backgroundColor = "";
    document.getElementById("submit_upload_button").style.color = "";
    //console.log("Encoded",encoded);
    var files = document.getElementById("imgfile").files;
    let label = document.getElementById('label').value;

    console.log(label);
    console.log(label == "");

    if (!files.length) {
        return alert("Please choose a file to upload first.");
    }

    var file = files[0];
    var fileName = file.name;
    console.log("File:", file);
    console.log(fileName);
    console.log("File type:", file.type);
    let config = {
        headers: { 'Content-Type': files.type, "X-Api-Key": "*****"}
    };

    url = '*****' + fileName;
    axios.put(url, files, config).then(response => {
        console.log(response.data)
        alert("Upload successful!!");
    });
}

function uploadImage(event){
    document.getElementById("submit_upload_button").style.backgroundColor = "";
    document.getElementById("submit_upload_button").style.color = "";
  //console.log("Encoded",encoded);
    var files = document.getElementById("imgfile").files;
    let label = document.getElementById('label').value;

    console.log(label);
    console.log(label == "");

    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }

    var file = files[0];
    var fileName = file.name;
    console.log("File:",file);
    console.log("File type:",file.type);
    last_index_quote = encoded.lastIndexOf('"');

    if(fileExt == 'jpg' || fileExt == 'jpeg'){
      encodedStr = encoded.substring(33, last_index_quote);  
      filetype = "image/"+ fileExt +";base64"
    }
    else{
        encodedStr = encoded.substring(32, last_index_quote);
        filetype = file.type +";base64"
    }

    var params = {
      'item': fileName,
      'folder': '6998hw2-photo-bucket',
      'Content-Type': filetype,
      'x-amz-meta-customLabels': label
    };
    console.log("Params are", params);

    var additionalParams = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': filetype,
            'X-Api-Key': '*****'
        }
    }

    apigClient.uploadFolderItemPut(params, encodedStr, additionalParams).then(function (result) {
        console.log("in uploadPut");
        console.log(result);
  document.getElementById("uploadResponse").innerHTML = "Uploaded image successfully";
}).catch(function(err) {
        console.log('Error!! Failed audio record.', err);
        document.getElementById("uploadResponse").innerHTML = "Failed to upload image";
    });
}





