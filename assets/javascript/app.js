var firebaseConfig = {
    apiKey: "AIzaSyAv21WtCaDCfO8tlnNgG8KSG2WDOL6aDgA",
    authDomain: "train-scheduler-e9fdc.firebaseapp.com",
    databaseURL: "https://train-scheduler-e9fdc.firebaseio.com",
    projectId: "train-scheduler-e9fdc",
    storageBucket: "",
    messagingSenderId: "1023297159417",
    appId: "1:1023297159417:web:0ed99505447c692a"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var database = firebase.database();
var rootRef = database.ref();
var editionKey = "";


var $trainName = $("#train-name");
var $destination = $("#destination");
var $firstTime = $("#first-time");
var $frequency = $("#frequency");
var $schedule = $("#schedule");
var $addTrainBtn = $("#add-train-btn");
var $editionButtons = $(".edition-buttons");
var $cancelEdition = $("#cancel-edition-btn");
var $updateTrain = $("#update-train-btn");



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

function nextArrival(minAway){
    var nextTrain = moment().add(minAway, "minutes");
    return moment(nextTrain).format("HH:mm");
}

function getFormFields(){
    var train = {};
    train.name = $trainName.val().trim();
    
    train.destination = $destination.val().trim();
    train.firstTime = $firstTime.val().trim();
    train.frequency = $frequency.val().trim();
    return train;
}

function clearFields(){
    editionKey = "";
    $trainName.val("");
    $destination.val("");
    $firstTime.val("");
    $frequency.val("");

    $editionButtons.css("display","none");
    $addTrainBtn.css("display","block");
}

function addTrain(){
    event.preventDefault();
    var train = getFormFields();    

    rootRef.push(train);

    clearFields();
}

function removeTrain(){
    var key = $(this).attr("data-key");
    rootRef.child(key).remove();
    $("#"+key).remove();
}

function editTrain(){
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

function cancelEdition(){
    clearFields();
}

function updateTrain(){
    var train = getFormFields(); 
    
    rootRef.child(editionKey).set(train); 
    renderSchedule(train, editionKey);   
    clearFields();

}
function retrieveSchedule(data){
    if(data != null){
        renderSchedule(data.val(), data.key);
    }
}

function renderSchedule(fields, key){
    var $row;
    var $delBtn = $("<button>").html("<i class='fas fa-minus'></i>");
    var $editBtn = $("<button>").html("<i class='fas fa-pen'></i>");

    if(editionKey === ""){
        $row = $("<tr>").attr("id",key);
    }
    else {
        $row = $("#"+key);
        $row.empty();
    }
    
    
    $delBtn.addClass("btn btn-danger");
    $delBtn.attr("data-key",key);
    $delBtn.click(removeTrain);
    
    $editBtn.addClass("btn btn-primary");
    $editBtn.attr("data-key",key);
    $editBtn.click(editTrain);

    var minAway = minutesAway(fields.firstTime, fields.frequency); //calculates minutes away
    
    $row.append($("<td>").text(fields.name));
    $row.append($("<td>").text(fields.destination));
    $row.append($("<td>").text(fields.frequency));
    $row.append($("<td>").text(nextArrival(minAway)));
    $row.append($("<td>").text(minAway));
    $row.append($("<td>").append($editBtn));
    $row.append($("<td>").append($delBtn));

    $schedule.append($row);

}

function onError(err){
    console.log("Error:");
    console.log(err);
}

rootRef.on("child_added", retrieveSchedule, onError);

$addTrainBtn.click(addTrain);
$cancelEdition.click(cancelEdition);
$updateTrain.click(updateTrain);


