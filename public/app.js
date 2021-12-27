    // app.js

// Making Connection
var socket = io();

// Querying the DOM

var titleText = document.getElementById('titleText');

// Chat DOM
var message = document.getElementById('chatConsoleMessage');
var btn = document.getElementById('chatConsoleSend');
var output = document.getElementById('chatConsoleOutput');
// Show Card
var cardUI = document.getElementById('cardUI');
//var showCard = document.getElementById('showCardBtn');
var exitCard = document.getElementById('exitCard');
// Game Start
var gameSetupConsole = document.getElementById('gameSetupConsole');
var gameStartBtn = document.getElementById('gameStartBtn');
// Username DOM
var usernameConsole = document.getElementById('usernameConsole');
var usernameInput = document.getElementById('usernameInput');
var usernameTriggerBtn = document.getElementById('usernameTriggerBtn');
var usernameBtn = document.getElementById('usernameBtn'); // to show the username panel
//var usernameIcon = document.getElementById('usernameIcon'); //


var showVote = document.getElementById('showVoteGUI');
// Header DOM (delete double instance later)
var mainHeader = document.getElementById('mainHeader');
var header = document.getElementById('mainHeader');
// Player List DOM
var playerListOutput = document.getElementById('playerList');

// Timer DOM 
var timeLeftDisplay = document.getElementById('time-left');
var timeInitDisplay = document.getElementById('time-init');
var currPhaseDisplay = document.getElementById('curr-phase');
// Game Setup DOM
var lobbyDuration = document.getElementById('lobbyDurInput');
var nightDuration = document.getElementById('nightDurInput');
var dayDuration = document.getElementById('dayDurInput');
var groupVoteDuration = document.getElementById('voteDurInput');

var mafiaInput = document.getElementById('mafiaInput');
var doctorInput = document.getElementById('doctorInput');
var detectiveInput = document.getElementById('detectiveInput');
var breadmanInput = document.getElementById('breadmanInput');

// chatroom buttons DOM
var chatroomBtnBox = document.getElementById('chatroomBtnBox');
var chatroomBtn0 = document.getElementById('chatroomBtn0');
var chatroomBtn1 = document.getElementById('chatroomBtn1');
var chatroomBtn2 = document.getElementById('chatroomBtn2');
const chatroomBtnArray = [chatroomBtn0, chatroomBtn1, chatroomBtn2];

//Popups

// Voting Buttons DOM
var groupVoteGUI = document.getElementById('groupVoteGUI'); 
var groupVoteButtons = document.querySelector(".groupVoteButtons");
var voteSelect = document.getElementById('voteSelect');
var exitVote = document.getElementById('exitVote');

// Event Notification
var gameEventGUI = document.getElementById('gameEventGUI');
var gameEventTitle = document.getElementById('gameEventTitle');
var gameEventText = document.getElementById('gameEventText');
var exitEvent = document.getElementById('exitEvent');




var idHeader = document.getElementById('idHeader');
var nameHeader = document.getElementById('nameHeader');

var actionUpdates = document.querySelector('.actionUpdates');
var actionUpdatesBox = document.querySelector('.actionUpdatesBox');
var actionHeader = document.querySelector(".actionHeader");
var actionText = document.querySelector(".actionText");

var roleUpdates = document.querySelector('.roleUpdates');
var roleUpdatesBox = document.querySelector('.roleUpdatesBox');


// NewUI
var indexUI = document.querySelector(".indexUI");
var createUI = document.querySelector(".createUI");
var gameUI = document.querySelector(".gameUI");
var gameEndUI = document.querySelector(".gameEndUI");


// Initial display
// Show layout (show + Wrapper/UI Name)
// Hide layout (hide + Wrapper/UI Name)



// indexUI
var indexBtn0 = document.getElementById('indexBtn0');
var indexBtn1 = document.getElementById('indexBtn1');
var indexBtn2 = document.getElementById('indexBtn2');
var indexBtn3 = document.getElementById('indexBtn3');


const indexBtn = [indexBtn0, indexBtn1, indexBtn2, indexBtn3];

for (i=0; i < indexBtn.length; i++) {
    document.getElementById("indexBtn"+i).addEventListener('click', (function(){
        var index = i;
        
        return function() {

            if (index == 0) {
                // console.log('Create Button');
                // indexUI.style.display = "none";
                // createUI.style.display = "grid";
            } else if (index == 1) {
                // console.log('Join Button');
                indexUI.style.display = "none";
                gameUI.style.display = "grid";
                socket.emit('joinGame');
            } else if (index == 2) {
                // console.log('Howto Button');
                // indexUI.style.display = "none";
            } else if (index == 3) {
                // console.log('About Button');
                // indexUI.style.display = "none";
            } else { console.log('currently unavailable'); }
            
        }
    })());
}

// createUI
var roomNameInput = document.getElementById('roomNameInput');
var createButton = document.getElementById('createButton');

createButton.addEventListener('click', function(){
    socket.emit('createRoom', {
        roomName: roomNameInput.value
    });

    createUI.style.display = "none";
    gameUI.style.display = "grid";
});

socket.on('createRoom', function(data){ // show card
    
    var roomId = data.roomId;
    var roomName = data.roomName;

    console.log(roomName + "  -0-  " + roomId);

    idHeader.innerHTML = roomId;
    nameHeader.innerHTML = roomName;


});


// joinUI


// gameUI -> index(return)

var iconHat = document.getElementById('iconHat');

// Taskbar Icons

var alertArr0 = document.getElementById('alertArr0');
var iconArr0 = document.getElementById('iconArr0');
var groupArr0 = document.getElementById('groupArr0');

var alertArr1 = document.getElementById('alertArr1');
var iconArr1 = document.getElementById('iconArr1');
var groupArr1 = document.getElementById('groupArr1');

var icon2 = document.querySelector('.icon2');
var alertArr2 = document.getElementById('alertArr2');
var iconArr2 = document.getElementById('iconArr2');
var groupArr2 = document.getElementById('groupArr2');

var playerListTitle = document.getElementById('playerListTitle');
var playerList = document.getElementById('playerList');

var panel = document.getElementsByClassName("panel");

const iconArr = [iconArr0, iconArr1, iconArr2];
const groupArr = [groupArr0, groupArr1, groupArr2];
const alertArr = [alertArr0, alertArr1, alertArr2];
/*
actionIcon.addEventListener('click', function(){
    for(var i = 0; i < panel.length; i++) {
        panel[i].style.display = "none";
    }
    actionGroup.style.display = "initial";
    console.log('test');
});
*/

iconHat.addEventListener('click', function(){ // On clicking username button
    gameUI.style.display = "none";
    indexUI.style.display = "grid";
    socket.emit('joinGlobal');
    idHeader.style.display = 'none';
    idHeader.style.display = 'none';
});

var active;
var display;

for (i=0; i < iconArr.length; i++) {
    document.getElementById("iconArr"+i).addEventListener('click', (function(){
        var index = i;
        return function() {
            for(var x = 0; x < panel.length; x++) {
                panel[x].style.display = "none";
            }
            if (display == false && active == index) {
                groupArr[index].style.display = "none";
                display = true;
            } else {
                groupArr[index].style.display = "inline";
                active = index;
                display = false;
                alertArr[index].style.display = "none";
            }
        }
    })());
}

socket.on('closePanels', function() {
    for(var x = 0; x < panel.length; x++) {
        panel[x].style.display = "none";
    }
})

socket.on('alertsClear', function() {
    for (i=0; i < iconArr.length; i++) {
        alertArr[i].style.display = "none";
    }
});

socket.on('showNameIcon', function() {
    usernameBtn.style.visibility = 'visible';
});

// gameEndUI

var gameEndExitBtn = document.getElementById('gameEndBtn1');
var gameEndPlayBtn = document.getElementById('gameEndBtn2');

var gameEndTitle = document.getElementById('gameEndTitle');
var gameEndSubtext = document.getElementById('gameEndSubtext');

socket.on('gameEndUI', function() {
    gameUI.style.display = "none";
    gameEndUI.style.display = "grid";
    idHeader.style.display = 'none';
    idHeader.style.display = 'none';
});

gameEndExitBtn.addEventListener('click', function(){
    gameEndUI.style.display = "none";
    indexUI.style.display = "grid";
});

gameEndPlayBtn.addEventListener('click', function(){
    gameEndUI.style.display = "none";
    gameUI.style.display = "grid";
    socket.emit('joinGame');
});

socket.on('gameEndPopup', function(data){
    gameEndTitle.innerHTML = data.title;
    gameEndSubtext.innerHTML = data.text;
});

// howtoUI -> index(return)

// aboutUI -> index(return)







var magicToggle = function(triggerID, className) {
    triggerID.addEventListener('click', function(){
        for(var i = 0; i < className.length; i++) {    
          if (className[i].style.display !== "none") {
            className[i].style.display = "none";
          } else
          className[i].style.display = "initial";
        }
    });
} 
// magicToggle(test, testButtons);
/*
var magicHide = function(triggerID, className) {
    triggerID.addEventListener('click', function(){ // On clicking username button
        for(var i = 0; i < className.length; i++) {
        className[i].style.display = "none";
        }
    });
}

var magicShow = function(triggerID, className) {
    triggerID.addEventListener('click', function(){ // On clicking username button
        for(var i = 0; i < className.length; i++) {
        className[i].style.display = "initial";
        }
    });
}
*/

// Use class names to specify items of a UI layout?


// Initial display

// Enable layout

// Hide layout














var windowHeight = function () {
// mobile size using --vh
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener('resize', () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});
} 
windowHeight();





// Emit events
/*
titleText.addEventListener('click', function(){ // On clicking chat button
    console.log('stop clicking me pls');
});*/

socket.on('serverHost', function(){ // hide and reset vote window
    gameSetupConsole.style.visibility= 'visible';
})




usernameTriggerBtn.addEventListener('click', function(){ // On clicking username button
    socket.emit('userSubmit', {
        user: usernameInput.value,
        socket: socket.id
    });
    //usernameIcon.style.rotate = '270deg';
}); // do an if statement to block out innapropriate or existing words

socket.on('exitUsername', function(){ // hide and reset vote window
    usernameConsole.style.visibility= 'hidden';
});


usernameBtn.addEventListener('click', function(){ // On clicking username button
    if (usernameConsole.style.visibility == 'visible'){
        usernameConsole.style.visibility = 'hidden';
    } else {
        usernameConsole.style.visibility = 'visible';
        usernameBtn.style.visibility = 'hidden';
    }
});


btn.addEventListener('click', function(){ // On clicking chat button
    socket.emit('chat', {
        message: message.value
    });
    message.value = '';
});

message.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
     event.preventDefault();
     btn.click();
    }
  });

socket.on('actionUpdate', function(data){
    var actionArr = data.actionArr;
    actionUpdatesBox.innerHTML = '';
    for (i = 0; i < actionArr.length; i++) {
        actionUpdatesBox.innerHTML += actionArr[i];
    } 
    alertArr0.style.display = 'inline';
});

socket.on('chatRoomUpdate', function(data){
    var chatRoom = data.chatRoom;
    output.innerHTML = '';
    for (i = 0; i < chatRoom.length; i++) {
        output.innerHTML += chatRoom[i];
    } 
});

socket.on('chatRoomUpdateAll', function(){
    output.innerHTML = '';
});





////////////////////////////////////////////
gameStartBtn.addEventListener('click', function(){ // On clicking start game counter
    socket.emit('gameBtn', {
        lobbyDuration: lobbyDuration.value,
        nightDuration: nightDuration.value,
        dayDuration: dayDuration.value,
        groupVoteDuration: groupVoteDuration.value,

        mafiaInput: mafiaInput.value,
        doctorInput: doctorInput.value,
        detectiveInput: detectiveInput.value,
        breadmanInput: breadmanInput.value
    });
    socket.emit('exitGameSetup', {
    });
});

playerListTitle.addEventListener('click', function(){ // On clicking playerList
    console.log(playerList.style.display);

    if (playerList.style.display !== 'block'){
        playerList.style.display = 'block';
    } else {
        playerList.style.display = 'none'
    }
    
});


socket.on('exitGameSetup', function(){ // hide and reset vote window
    gameSetupConsole.style.visibility= 'hidden';
});




socket.on('getVote', function(){ // on server request, send the votes
    socket.emit('getVote', {
        vote: voteSelect.innerHTML
    });
});




// display buttons

socket.on('chatroomsInit', function(data){
    var visibility;
    for (i = 0; i < data.playerRooms.length; i++) {
        if (data.playerRooms[i] === '') {
            visibility = 'hidden'
        } else {
            chatroomBtnArray[i].innerHTML = data.playerRooms[i]; // update text to button name
            visibility = 'visible';
        }
        chatroomBtnArray[i].style.visibility = visibility;
    }
    console.log('chatroomsinit tes ****' + data.playerRooms);
});

socket.on('detectiveInit', function(data){
    icon2.style.display = 'inline';
});

socket.on('detectiveClear', function(data){
    icon2.style.display = 'none';
});

/*
// on button clicks
for (i = 0; i < chatroomBtnArray.length; i++) {
    chatroomBtnArray[i].addEventListener('click', function(){
        key = chatroomBtnArray[i].innerHTML;
        socket.emit('chatroomsVerify', {
            key: key
        })
    });
}
*/

// Chat button generator
for (i=0; i < chatroomBtnArray.length; i++) {
    document.getElementById("chatroomBtn"+i).addEventListener('click', (function(){
        var index = i;
        return function() {
            socket.emit('chatroomsVerify', {
                index: index
            })
        }
    })());
}



// on verification of chatroom button (clientside response module)
socket.on('chatroomsVerify', function(data){
        if (data.verified == true) { // verify permission to access this button
            console.log('detected a button click as expected') // hide current chatroom, display the new chatroom 
        } else {
            console.log('detected an unexpected button click') // refresh user's buttons as they should be, maybe later add a cheating log
        }
})


/* Listen for events
socket.on('chat', function(data){ // place message in chat
    output.innerHTML += `<p> ${data.playerName}: ${data.message}</p>`;
    message.value = '';
});*/

socket.on('messageAlert', function(data){ // place message in chat
    alertArr2.style.display = 'inline';
});

/*
socket.on('userSubmit', function(data){ // show card
    console.log(`welcome ${data.user}`);
    //
})
*/
socket.on('gameStart', function(){ // show card
    //gameStart();
    console.log('game started clientside');
});

socket.on('nameUIUpdate', function(data){ // show card
    header.innerHTML = `Welcome ${data.name}.`;
    console.log('nameUIupdated ' + data.name);
});

socket.on('roleUIUpdate', function(data){ // show card
    header.innerHTML = `${data.name} your role is ${data.role}`;
    console.log('roleUIupdated- ' +  `${data.name} your role is ${data.role}`);
});

socket.on('header', function (data) {
    header.innerHTML = data.header;
    console.log('headerupdated ' + data.header);
});

socket.on('playerList', function (data) {
    playerListOutput.innerHTML = data.playerListParse; //update the clientside html to the value of update function
});

socket.on('timerUpdate', function (data) {
    // simply refreshes the timer related DOM element on clientside
    timeLeftDisplay.innerHTML = data.timeLeft;
    currPhaseDisplay.innerHTML = data.phaseTitle;
});





// Show and hide elements

socket.on('hideById', function(data){ //
    document.getElementById(`${data.ID}`).style.visibility= 'hidden' ;
});



/*showVote.addEventListener('click', function(){ //
    socket.emit('showVote', { 
    });
}); */

socket.on('showVote', function(data){ // show card
    groupVoteButtons.innerHTML = data.buttonParse;
    voteSelect.innerHTML = '';
    groupVoteGUI.style.visibility= 'visible';
});


exitVote.addEventListener('click', function(){
    socket.emit('exitVote', { // for verification ONLY
        vote: voteSelect.innerHTML
    });
});

socket.on('exitVote', function(){ // hide and reset vote window
    groupVoteGUI.style.visibility= 'hidden';
});


exitEvent.addEventListener('click', function(){ // On clicking event close button
    socket.emit('exitEvent', {
    });
});

socket.on('exitEvent', function(){ // hide and reset vote window
    gameEventGUI.style.visibility= 'hidden';
});


/*
showCard.addEventListener('click', function(){ // On clicking show card button
    socket.emit('showCard', {
    });
});*/

socket.on('showEvent', function(data){
    gameEventTitle.innerHTML = data.title;
    gameEventText.innerHTML = data.text;
    gameEventGUI.style.visibility= 'visible';
    if (data.kill == true) { // fires if this event kills the player
        header.innerHTML = 'You are a spectator'
    }
});

socket.on('exitEvent', function(){
    gameEventGUI.style.visibility= 'hidden';
});



socket.on('showCard', function(){ // show card
    cardUI.style.visibility= 'visible';
});



/*
exitCard.addEventListener('click', function(){
    socket.emit('exitCard', {
    });
});


socket.on('exitCard', function(){ // show card
    cardUI.style.visibility= 'hidden';
});
*/

