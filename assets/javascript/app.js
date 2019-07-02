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
//firebase.initializeApp(firebaseConfig);

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

function clearFields(){
    editionKey = "";
    $trainName.val("");
    $destination.val("");
    $firstTime.val("");
    $frequency.val("");

    $editionButtons.css("display","none");
    $addTrainBtn.css("display","block");
    $form.removeClass("was-validated");
    
}

function addTrain(){
    event.preventDefault();
    var train = getFormFields();    

    if(validateFields(train)){
        rootRef.push(train);
        clearFields();
    }
    
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
    
    $row.addClass("train-schedule");
    $row.attr("data-first-time",fields.firstTime);

    $delBtn.addClass("btn btn-danger");
    $delBtn.attr("data-key",key);
    $delBtn.click(removeTrain);
    
    $editBtn.addClass("btn btn-primary");
    $editBtn.attr("data-key",key);
    $editBtn.click(editTrain);

    var minAway = minutesAway(fields.firstTime, fields.frequency); //calculates minutes away
    
    $row.append($("<td class='train-name'>").text(fields.name));
    $row.append($("<td class='destination'>").text(fields.destination));
    $row.append($("<td class='frequency'>").text(fields.frequency));
    $row.append($("<td class='next-arrival'>").text(nextArrival(minAway)));
    $row.append($("<td class='min-away'>").text(minAway));
    $row.append($("<td>").append($editBtn));
    $row.append($("<td>").append($delBtn));

    $schedule.append($row);
    
    
}

function trainArrived(name, destination, timeout){
    var $train = $("<figure class='train'>");
    var $caption = $("<figcaption>");
    var $trainImg = $("<img src='assets/images/train.gif'>");
    var railWidth = $rail.css("width").replace("px","");
    var railWidth = parseInt(railWidth) + 200;
    
    $caption.html(`<p class='caption-name'>${name}</p><p class='caption-destination'>To: ${destination}</p>`);
    $train.append($caption);
    $train.append($trainImg);
    
    $train.css("left","-150px");
    setTimeout(function(){
        $train.animate({left:"+="+railWidth+"px"},11000, function(){
            $(this).remove();
        });
        $rail.append($train);
    },timeout);  //delay train arrive in order to see trains arriving at the same time
    

}

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

function onError(err){
    console.log("Error:");
    console.log(err);
}



$(document).ready(function(){
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    database = firebase.database();
    rootRef = database.ref();
    editionKey = "";

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

    rootRef.on("child_added", retrieveSchedule, onError);
    $addTrainBtn.click(addTrain);
    $cancelEdition.click(cancelEdition);
    $updateTrain.click(updateTrain);

    interval = setInterval(minuteUpdate,10000);
    trainArrived("Canada Vacation", "Vancouver");
});
