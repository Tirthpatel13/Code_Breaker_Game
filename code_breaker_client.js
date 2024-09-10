var NUM_BALLS = 8; // num of balls for selection, it must be in range of CODE_LENGTH..8
var CODE_LENGTH = 5; // set this number in the range of 1..5
var NUM_ATTEMPTS = 8; // change this number to have less or more attempts in range of 1..8
var MAX_NUM_ATTEMPTS = 8; // do not change this number

var peg_selected = 0;
var attempt_code;
var current_attempt_id;
var start = new Date();
var btn_initial_top;
var gameEndTime; // To store the game end time
var popupTimeout; // To store the popup timeout ID
//var url = "http://indigo.eecs.yorku.ca:3000/post";
var url = "http://localhost:3000/post";

var myName;

window.onload = function() {
    createGameBoard(); // Draw the game board
    
    // Read CSS to define the button initial position
    var step = parseInt($(".attempt").css("margin-top")) 
                + parseInt($(".attempt").css("height"));
    var attemptHeight = parseInt($(".attempt").css("height"));
    btn_initial_top = parseInt($("#acceptcode").css("top")) 
                      - (MAX_NUM_ATTEMPTS - NUM_ATTEMPTS) * step;
    
    // Set game board height. 
    $("#gameboard").css("height", NUM_ATTEMPTS * step + attemptHeight + "px");
    
    // Game player will enter their name here
    myName = prompt("Please enter your name", "");
    $('#name').text(myName);
    
    initGameBoard();
    
    // Start the timer
    setInterval(function() {
        $("#timer").text(parseInt((new Date() - start) / 1000) + "s");
    }, 1000);
    
    // Add click handler for the info button
    $("#infoButton").click(function() {
        $("#rulesModal").fadeIn();
    });
    
    // Add click handler for the close button in the modal
    $(".close").click(function() {
        $("#rulesModal").fadeOut();
    });
    
    // Close the modal when clicking outside of it
    $(window).click(function(event) {
        if ($(event.target).is("#rulesModal")) {
            $("#rulesModal").fadeOut();
        }
    });
}

/* 
 * Create the game board, includes 
 * one line to display the code images - "coderow"
 * 8 attempts
 * 1 accept button
 * 8 peg selections
 */
function createGameBoard() {
    // Add code images (dummy code)
    for (var i = 1; i <= CODE_LENGTH; i++) {
        var newImg = document.createElement("img");
        $(newImg).attr("id", "code" + i);
        // Add a dummy image
        $(newImg).attr("src", "./images/hole.png");
        $("#coderow").append(newImg);
    }

    // Add attempts
    for (var i = NUM_ATTEMPTS; i > 0; i--) {
        // For each attempt, we create a div
        var newDiv = document.createElement("div");
        // Set its id and class
        $(newDiv).attr("id", "attempt" + i);
        $(newDiv).attr("class", "attempt");
        
        // Create a span, and set its id and class
        var newSpan = document.createElement("span");
        $(newSpan).attr("id", "attempt" + i + "pegs");
        $(newSpan).attr("class", "futureattempt");
        // Then add 5 images including ids and classes. The img source could be empty or could be the hole.png
        for (var j = 1; j <= CODE_LENGTH; j++) {
           var newImg = document.createElement("img");
            $(newImg).attr("src", "./images/hole.png");
            $(newImg).attr("id", "attempt" + i + "_" + j);
            $(newImg).attr("class", "imgAttempt");
            $(newSpan).append(newImg);
        }
        // Append the span to the div
        $(newDiv).append(newSpan);
        
        // Create a new span for displaying result of the end-user attempt, set id and append it to the div
        var newSpan = document.createElement("span");
        $(newSpan).attr("id", "attempt" + i + "result");
        $(newDiv).append(newSpan);

        // Append each div to the game board        
        $("#gameboard").append(newDiv);
    }
   
    // Add Accept button inside a <div>
    var newDiv = document.createElement("div");
    $(newDiv).attr("id", "acceptcode");
    var newInput = document.createElement("input");
    $(newInput).attr("type", "button");
    $(newInput).attr("name", "Accept");
    $(newInput).attr("value", "Accept");
    $(newInput).click(process_attempt); // Set onclick event handler
    $(newDiv).append(newInput);
    // Add this button div to the game board
    $("#gameboard").append(newDiv);

    // Add peg selection    
    // Create 8 img elements and 
    // Show each of the 8 marbles images with shadow from the images folder, also set their id and event handler 
    for (var i = 1; i <= NUM_BALLS; i++) {
        var newImg = document.createElement("img");
        $(newImg).attr("src", "./images/shadow_ball_" + i + ".png");
        $(newImg).attr("id", "shadow" + i);
        // Set onclick event handler and pass event.data.id as a parameter
        $(newImg).click({id: i}, select_peg);
        $("#pegselection").append(newImg);
    }

    // Add info button
    var infoButton = document.createElement("div");
    $(infoButton).attr("id", "infoButton");
    $(infoButton).text("i");
    $("#gameboard").append(infoButton);
}

/* 
 * Initiate the game board
 * Reset all the holds
 * Reset the btn position and its visibility
 * Send a "generate code" request to the server
 */
function initGameBoard() {
    // Reset holds
    for (var i = NUM_ATTEMPTS; i > 0; i--) {
        for (var j = 1; j <= CODE_LENGTH; j++) {
            // Reset the image on each hole
            $("#attempt" + i + "_" + j).attr("src", "./images/hole.png");
            $("#attempt" + i + "_" + j).css({'opacity': 0.3});
        }
        // Reset the "attempt#result" to empty
        $("#attempt" + i + "result").empty();
    }
    
    // Reset the button's position and visibility
    current_attempt_id = 0;
    var step = parseInt($(".attempt").css("margin-top")) 
             + parseInt($(".attempt").css("height"));
    $("#acceptcode").css({'top': btn_initial_top + 'px'});
    $("#acceptcode").css({'visibility': 'visible'});
    
    // Show the cover to hide code 
    $("#cover").css({'visibility': 'visible'});
    
    // Send request to server to start a new game.
    $.post(url + '?data=' + JSON.stringify({
                            'name': myName, // Client's identity on the server
                            'action': 'generateCode'}),
           response);
}

/* 
 * Activate an attempt
 * @param id is the attempt id to be activated
 */
function activateAttempt(id) {
    // Remove onclick event for all holes
    $(".imgAttempt").off("click");
    
    // Reset the visibility of the current attempt, 
    // and add onclick event to the holes in this attempt
    for (var i = 1; i <= CODE_LENGTH; i++) {
        $("#attempt" + id + "_" + i).css({'opacity': 1});
        $("#attempt" + id + "_" + i).click({id: i}, process_hole);
    }
    
    current_attempt_id = id;
    
    // Reset the attempt code array
    attempt_code = new Array(CODE_LENGTH).fill(0);
}

/*
 * OnClick event handler for holes
 * @param event.data.id is the hole's id in this attempt
 */
function process_hole(event) {
    if (peg_selected != 0) {
        // Display the selected ball on the hold
        $(this).attr("src", "./images/ball_" + peg_selected + ".png");
        attempt_code[event.data.id - 1] = peg_selected;
    } else {
        // No ball was selected
        alert("Please select the ball!");
    }
}

/*
 * OnClick event handler for the Accept button
 * Send request to the server
 */
function process_attempt() {
    if (!attempt_code.includes(0)) {
        // Move the button up and display the result
        var step = parseInt($(".attempt").css("margin-top")) 
        + parseInt($(".attempt").css("height"));
        
        $(this).parent().css({'top': btn_initial_top 
                        - current_attempt_id * step + 'px'});

        // Send the attempt_code to server for evaluation
        $.post(
            url + '?data=' + JSON.stringify({
            'name': myName, 
            'action': 'evaluate', 
            'attempt_code': attempt_code, 
            'current_attempt_id': current_attempt_id
            }),
            response
        );
        // Hide the btn to wait for server's response
        $(this).parent().css({'visibility': 'hidden'});
    } else {
        // The attempt is not completed.
        alert("Please complete your attempt!");
    }
}
/*
 * Display result in "attempt#result" span 
 * @param num is the number of images to display
 * @param color is the color of the image
 */
function displayResult(num, color) {
    while (num > 0) {
        // Add image to result
        var newImg = document.createElement("img");
        $(newImg).attr("src", "./images/" + color + "_peg.png");
        $("#attempt" + current_attempt_id + "result").append(newImg);
        num--;
    }
}

/* 
 * Display the code when the client completed the game
 * The client won the game or lost the game after 8 attempts.
 * @param code is the code to display
 */
function displayCode(code) {
    for (var i = 1; i <= CODE_LENGTH; i++) {
        $("#code" + i).attr("src", "./images/ball_" + code[i - 1] + ".png");
    }
}

/*
 * Event handler for server's response
 * @param data is the JSON format string sent from the server
 */
function response(data, status) {
    try {
        var response = JSON.parse(data);
        console.log(response);
    } catch (e) {
        console.error("Failed to parse response:", e);
        alert("Server error! Please try again.");
        return;
    }
    if (response['action'] == 'generateCode') {
        
        myName = response['nameID'];   

        // Action: Generate Code
        activateAttempt(1); // Activate the first attempt
        peg_selected = 0;   // No peg should be selected 
        // Reset the visibility of every shadow_balls
        for (var i = 1; i <= NUM_BALLS; i++) {
            $("#shadow" + i).css({'opacity': 1});
        }
        
        // Reset timer
        start = new Date();
        
    } else if (response['action'] == 'evaluate') {
        // Action: Evaluate
        // After receiving the server's response, 
        // Then make the button <div> visible
        $("#acceptcode").css({'visibility': 'visible'});
        
        // Read data from the JSON object sent back from the server
        var win = response['win'];
        var num_match = response['num_match'];
        var num_containing = response['num_containing'];
        var num_not_in = response['num_not_in'];
        var code = response['code'];
        
        // Display the number of balls that match the code
        displayResult(num_match, "black");
        // Display the number of balls in the code
        displayResult(num_containing, "white");
        // Display the number of balls not in the code
        displayResult(num_not_in, "empty");
        
        if (current_attempt_id < NUM_ATTEMPTS && !win) {
            // Haven't won yet, game will continue
            // Activate the next attempt
            current_attempt_id++;
            activateAttempt(current_attempt_id);
        } else {
            // Game ended, display result, hide button
            $("#acceptcode").css({'visibility': 'hidden'}); // Hide button <div>
            $("#cover").css({'visibility': 'hidden'});     // Hide code cover to display the code
            displayCode(code);                  // Display the code
            
            // Clear the popup timeout
            clearTimeout(popupTimeout);
            
            // Store game end time
            gameEndTime = new Date();
            
            // Display the result
            var resultMessage = win ? "GG! You win. Click enter to play again." : "Uh Oh, Click enter to try again!";
            alert(resultMessage);
            
            // Reset the game board
            initGameBoard();
        }
    }
}




/*
 * Event handler for peg selection
 * @param event.data.id is the peg id to be selected
 */
function select_peg(event) {
    peg_selected = event.data.id;
    // Reset the visibility of every balls
    for (var i = 1; i <= NUM_BALLS; i++) {
        $("#shadow" + i).css({'opacity': 0.45});
    }
    // Increase the visibility of the selected ball
    $(this).css({'opacity': 1});
}
