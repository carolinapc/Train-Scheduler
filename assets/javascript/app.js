var firebaseConfig = {
    apiKey: "AIzaSyAv21WtCaDCfO8tlnNgG8KSG2WDOL6aDgA",
    authDomain: "train-scheduler-e9fdc.firebaseapp.com",
    databaseURL: "https://train-scheduler-e9fdc.firebaseio.com",
    projectId: "train-scheduler-e9fdc",
    storageBucket: "",
    messagingSenderId: "1023297159417",
    appId: "1:1023297159417:web:0ed99505447c692a"
};

var database;
var rootRef;
var editionKey = "";
var interval;

var $rail;
var $trainName;;
var $destination;
var $firstTime;
var $frequency;
var $schedule;
var $addTrainBtn;
var $editionButtons;
var $cancelEdition;
var $updateTrain;
var $form;
var $titleForm;
var $soundEffect;
var $user;
var $signin;
var $main;
var $formSection;
var $loading;


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
database = firebase.database();
rootRef = database.ref();

//calculates the minutes away
function minutesAway(firstTime, frequency){
    // First Time (pushed back 1 year to make sure it comes before current time)
    var firstTimeConverted = moment(firstTime, "HH:mm").subtract(1, "years");

    // Difference between the times (current and first time)
    var diffTime = moment().diff(moment(firstTimeConverted), "minutes");

    // Time apart (remainder)
    var tRemainder = diffTime % frequency;

    // Minute Until Train
    return (frequency - tRemainder);
    
}

//play audio on the audio object passed
function playAudio(obj, effect){
    var objAudio = document.getElementById(obj);
    objAudio.src = "assets/sounds/"+effect+".mp3";
    objAudio.load();
    objAudio.play();
}

//calculates next arrival train
function nextArrival(minAway){
    var nextTrain = moment().add(minAway, "minutes");
    return moment(nextTrain).format("HH:mm");
}

//grab the form fields
function getFormFields(){
    var train = {};
    train.name = $trainName.val().trim();
    
    train.destination = $destination.val().trim();
    train.firstTime = $firstTime.val().trim();
    train.frequency = $frequency.val().trim();

    return train;
}

//validates the form fields
function validateFields(){
    if(form.checkValidity() === false){
        form.classList.add('was-validated');
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    else
        return true;

}

//clears the form fields and let them as insert status
function clearFields(){
    editionKey = "";
    $trainName.val("");
    $destination.val("");
    $firstTime.val("");
    $frequency.val("");

    $editionButtons.css("display","none");
    $addTrainBtn.css("display","block");
    $form.removeClass("was-validated");
    $formTitle.text("Add Train");
    
}

//add a new train to database
function addTrain(){
    event.preventDefault();
    var train = getFormFields();    

    if(validateFields(train)){
        rootRef.push(train);
        clearFields();
    }
    
}

//remove a train from the database
function removeTrain(){
    var key = $(this).attr("data-key");
    rootRef.child(key).remove();
    $("#"+key).remove();
}

//prepares the form fields for edition
function editTrain(){
    $formTitle.text("Edit Train");
    editionKey = $(this).attr("data-key");
    rootRef.child(editionKey).once("value", function(data){
        var field = data.val();
        $trainName.val(field.name);
        $destination.val(field.destination);
        $firstTime.val(field.firstTime);
        $frequency.val(field.frequency);
        $editionButtons.css("display","block");
        $addTrainBtn.css("display","none");
    });
    
}

//cancel the form fields edition
function cancelEdition(){
    event.preventDefault();
    clearFields();
}

//updates the train on the database and the screen
function updateTrain(){
    event.preventDefault();
    var train = getFormFields(); 
    
    if(validateFields(train)){
        rootRef.child(editionKey).set(train); 
        renderSchedule(train, editionKey);   
        clearFields();
    }
}

//retrieve schedule from database
function retrieveSchedule(data){
    if(data != null){
        renderSchedule(data.val(), data.key);
    }
}

//update the schedules on the screen
function renderSchedule(fields, key){
    var $row;
    var $delBtn = $("<button>").html("<i class='fas fa-minus'></i>");
    var $editBtn = $("<button>").html("<i class='fas fa-pen'></i>");
    var currentTime = moment().format("HH:mm");
    var minAway = minutesAway(fields.firstTime, fields.frequency); //calculates minutes away

    if(currentTime === nextArrival(minAway)){
        minAway = 0;
    }

    if(editionKey === ""){
        $row = $("<tr>").attr("id",key);
    }
    else {
        $row = $("#"+key);
        $row.empty();
    }
    
    $row.addClass("train-schedule");
    $row.attr("data-first-time",fields.firstTime);

    $delBtn.addClass("btn btn-danger");
    $delBtn.attr("data-key",key);
    $delBtn.click(removeTrain);
    
    $editBtn.addClass("btn btn-secondary");
    $editBtn.attr("data-key",key);
    $editBtn.click(editTrain);
    
    $row.append($("<td class='train-name'>").text(fields.name));
    $row.append($("<td class='destination'>").text(fields.destination));
    $row.append($("<td class='frequency'>").text(fields.frequency));
    $row.append($("<td class='next-arrival'>").text(nextArrival(minAway)));
    $row.append($("<td class='min-away'>").text(minAway));
    $row.append($("<td>").append($editBtn));
    $row.append($("<td>").append($delBtn));

    $schedule.append($row);
    
    
}

//animates the train arrival
function trainArrived(name, destination, timeout){

    var $train = $("<figure class='train'>");
    var $caption = $("<figcaption>");
    var $trainImg = $("<img src='assets/images/train.gif'>");
    var railWidth = $rail.css("width").replace("px","");
    var railWidth = parseInt(railWidth) + 200;

    $caption.html(`<p class='caption-name'>${name}</p><p class='caption-destination'>To: ${destination}</p>`);

    $train.append($caption);
    $train.append($trainImg);
    $train.css("left","-200px");

    setTimeout(function(){
        playAudio("sound-effect","train");
        playAudio("sound-effect2","train-whistle");

        $train.animate({left:"+="+railWidth+"px"},11000, function(){
            $(this).remove();
        });
        $rail.append($train);
    },timeout);  //delay train arrive in order to see trains arriving at the same time
    

}

//update time information of all trains
function minuteUpdate(){
    timeout = 1000;
    $(".train-schedule").each(function(index, row){
        var currentTime = moment().format("HH:mm");
        var firstTime = $(row).attr("data-first-time");
        var rowKey = $(row).attr("id");
        var frequency = $("#"+rowKey+" .frequency").text().trim();
        var $rowNextArrival = $("#"+rowKey+" .next-arrival");
        var $rowMinAway = $("#"+rowKey+" .min-away");
        var trainName = $("#"+rowKey+" .train-name").text().trim();
        var trainDestination = $("#"+rowKey+" .destination").text().trim();
        var minAway = minutesAway(firstTime, frequency);

        if(currentTime == $rowNextArrival.text().trim()){
            trainArrived(trainName, trainDestination, timeout);
            timeout += 3000;
        }

        $rowNextArrival.text(nextArrival(minAway));
        $rowMinAway.text(minAway);

        
    });

}

//log on the console the errors
function onError(err){
    console.log("Error:");
    console.log(err);
}

//execute the sign in chose by the user
function signIn(choice){
    var provider;

    switch (choice) {
        case "google":
            provider = new firebase.auth.GoogleAuthProvider();
            break;
        case "facebook":
            provider = new firebase.auth.FacebookAuthProvider();
            break;
        case "github":
            provider = new firebase.auth.GithubAuthProvider();
            break;
        default:
            break;
    }
    
    localStorage.setItem("auth","waiting");
    firebase.auth().signInWithRedirect(provider);

}

//logout the user
function signOut(){
    firebase.auth().signOut().then(function() {
        showSignIn();
        localStorage.setItem("auth","no");
    }).catch(function(error) {
        console.log("Sign out error:");
        console.log(error);
    });
}

//shows the sign in options for the user choose
function showSignIn(){
    if(localStorage.getItem("auth") == "no"){
        $user.css("display","none");
        $signin.css("display","flex");
        $loading.css("display","none");
        $main.css("display","none");
        $formSection.css("display","none");
        $schedule.empty();

        clearInterval(interval);
        clearFields();

        rootRef.off("child_added");
    }
}

//starts application
function app(user){
    localStorage.setItem("auth","yes");

    $("#auth-message").text("");
    $user.css("display","flex");
    $("#user-name").text(user.displayName);

    $main.css("display","flex");
    $formSection.css("display","flex");
    $signin.css("display","none");
    $loading.css("display","none");

    rootRef.on("child_added", retrieveSchedule, onError);
    $addTrainBtn.click(addTrain);
    $cancelEdition.click(cancelEdition);
    $updateTrain.click(updateTrain);

    interval = setInterval(minuteUpdate,10000);
}


$(document).ready(function(){

    $main = $("#main").css("display","none");
    $formSection = $("#form-section").css("display","none");
    $loading = $("#loading");
    $rail = $("#rail");
    $trainName = $("#train-name");
    $destination = $("#destination");
    $firstTime = $("#first-time");
    $frequency = $("#frequency");
    $schedule = $("#schedule");
    $addTrainBtn = $("#add-train-btn");
    $editionButtons = $(".edition-buttons");
    $cancelEdition = $("#cancel-edition-btn");
    $updateTrain = $("#update-train-btn");
    $form = $("#form");
    $formTitle = $("#form-title");    
    $signin = $("#signin");
    $user = $("#user");
    $signout = $("#signout").click(signOut);

    if(localStorage.getItem("auth") == "waiting"){
        $signin.css("display","none");
        $loading.css("display","flex");
    }
    else{
        $signin.css("display","flex");
        $loading.css("display","none");
    }
    
    

    firebase.auth().getRedirectResult().then(function(result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // ...
        }
        // The signed-in user info.
        var user = result.user;
        
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        localStorage.setItem("auth","no");
        $signin.css("display","flex");
        $loading.css("display","none");
        $("#auth-message").text(errorMessage + " ("+email+")");
    });      

    //checks if the user is authenticated
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            app(user);
        } else {
            showSignIn();
        }
    });

    $(".signin-buttons").click(function(){
        var choice = $(this).val();
        signIn(choice);
    });
    
});
