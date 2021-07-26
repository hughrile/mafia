    // app.js

// Making Connection
var socket = io.connect('http://localhost:3000')

// Querying the DOM

var titleText = document.getElementById('titleText');

// Chat DOM
var message = document.getElementById('chatConsoleMessage');
var btn = document.getElementById('chatConsoleSend');
var output = document.getElementById('chatConsoleOutput');
// Show Card
var cardUI = document.getElementById('cardUI');
var showCard = document.getElementById('showCardBtn');
var exitCard = document.getElementById('exitCard');
// Game Start
var gameSetupConsole = document.getElementById('gameSetupConsole');
var gameStartBtn = document.getElementById('gameStartBtn');
// Username DOM
var usernameConsole = document.getElementById('usernameConsole');
var usernameInput = document.getElementById('usernameInput');
var usernameBtn = document.getElementById('usernameBtn');
var showVote = document.getElementById('showVoteGUI');
var roleInit = document.getElementById('roleInit');
// Header DOM (delete double instance later)
var mainHeader = document.getElementById('mainHeader');
var header = document.getElementById('mainHeader');
// Player List DOM
var playerListOutput = document.getElementById('player-list');

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


var showEventBtn = document.getElementById('showEventBtn');

// Emit events

titleText.addEventListener('click', function(){ // On clicking chat button
    console.log('stop clicking me pls');
});

socket.on('serverHost', function(){ // hide and reset vote window
    gameSetupConsole.style.visibility= 'visible';
})




usernameBtn.addEventListener('click', function(){ // On clicking username button
    socket.emit('userSubmit', {
        user: usernameInput.value,
        socket: socket.id
    });
}); // do an if statement to block out innapropriate or existing words

socket.on('exitUsername', function(){ // hide and reset vote window
    usernameConsole.style.visibility= 'hidden';
})


/*
roleInit.addEventListener('click', function(){ // On clicking show card button
    socket.emit('roleInit', {
    });
});
*/

btn.addEventListener('click', function(){ // On clicking chat button
    socket.emit('chat', {
        message: message.value
    });
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

socket.on('exitGameSetup', function(){ // hide and reset vote window
    gameSetupConsole.style.visibility= 'hidden';
})




socket.on('getVote', function(){ // on server request, send the votes
    socket.emit('getVote', {
        vote: voteSelect.innerHTML
    });
});



// Listen for events
socket.on('chat', function(data){ // place message in chat
    output.innerHTML += '<p>' + data.message + '</p>'
})


/*
socket.on('userSubmit', function(data){ // show card
    console.log(`welcome ${data.user}`);
    //
})
*/
socket.on('gameStart', function(){ // show card
    //gameStart();
    console.log('game started clientside');
})

socket.on('roleInit', function(data){ // show card
    
    header.innerHTML = `${data.name} your role is ${data.role}`;
})

socket.on('header', function (data) {
    header.innerHTML = data.header;
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
})



/*showVote.addEventListener('click', function(){ //
    socket.emit('showVote', { 
    });
}); */

socket.on('showVote', function(data){ // show card
    groupVoteButtons.innerHTML = data.buttonParse;
    voteSelect.innerHTML = '';
    groupVoteGUI.style.visibility= 'visible';
})


exitVote.addEventListener('click', function(){ // On clicking chat button
    console.log(voteSelect.innerHTML);
    socket.emit('exitVote', { // for verification ONLY
        vote: voteSelect.innerHTML
    });
});

socket.on('exitVote', function(){ // hide and reset vote window
    groupVoteGUI.style.visibility= 'hidden';
})


exitEvent.addEventListener('click', function(){ // On clicking event close button
    socket.emit('exitEvent', {
    });
});

socket.on('exitEvent', function(){ // hide and reset vote window
    gameEventGUI.style.visibility= 'hidden';
})



showCard.addEventListener('click', function(){ // On clicking show card button
    socket.emit('showCard', {
    });
});


showEventBtn.addEventListener('click', function(data){ // On clicking show card button
    gameEventGUI.style.visibility= 'visible';
}); 

socket.on('showEvent', function(data){
    gameEventTitle.innerHTML = data.title;
    gameEventText.innerHTML = data.text;
    gameEventGUI.style.visibility= 'visible';
    header.innerHTML = 'You are a spectator'
})



socket.on('showCard', function(){ // show card
    cardUI.style.visibility= 'visible';
})




exitCard.addEventListener('click', function(){ // On clicking chat button
    socket.emit('exitCard', {
    });
});

socket.on('exitCard', function(){ // show card
    cardUI.style.visibility= 'hidden';
})