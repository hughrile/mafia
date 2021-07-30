const PORT = process.env.PORT || 3000;

const path = require('path');
const express = require('express');
const app = express();

const httpServer = require("http").createServer(app);
const options = { /* ... */ };
const io = require("socket.io")(httpServer, options);

var bodyParser = require('body-parser');
var EventEmitter = require("events").EventEmitter;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



// Server state variables
var checkNum = -1;
var voteNum = 0;
var gVcounter = 0;
var phaseNumber = 1; // used to trigger next phase in a cycle, not reliable as the current value
var roundNumber = 1;
var maxRounds = 50; // Must be optional
var serverHost;
var roomno = 1; // room variable
var socketArray = [] // global sockets array

var allowPlayers = true;
var gameStarted = false;

var phaseTimer;
var phaseTimeOut;
var voteTimeOut;

var spectatorTotal = 0;

// import the functions module
let functions = require('./public/function.js');
const { playersArray } = require('./public/function.js');

// Event emitter (server -> server) communication
var srv = new EventEmitter();

// Set static folder
app.set('views', __dirname + '/views');
app.set('view engine', "pug");
app.engine('pug', require('pug').__express);
app.get("/", function(req, res){
	res.render("index");
});

app.use(express.static(path.join(__dirname, "/public")));


io.on('connection', socket => { // connection start

  if (allowPlayers == true) { // Create unnamed player using socketID

    functions.userCreate(socket.id);
    socketArray.push(socket.id);
    io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });

    if (serverHost === undefined || serverHost === '') { // first player becomes host
      serverHost = playersArray[functions.getPlayerBySocket(socket.id)]
      //console.log('server host applied to ' + serverHost.playerName);
      setTimeout(function(){
        if (socket.id == serverHost.socketId) {
          socket.emit('serverHost')
        }
      }, 2000);
    }


  } else { // Connect as spectator

    console.log(`Spectator connected`);
    spectatorTotal++

  }

  console.log(`${socketArray.length} instances connected`);

  socket.on('disconnecting', () => {


   if (functions.isSpectator(socket.id) == true) {

    console.log(`Spectator disconnected (${socket.id})`);

    } else {

      playersArray.splice(functions.getPlayerBySocket(socket.id), 1); // remove player
      socketArray.splice(functions.getSocketArray(socket.id), 1); // current progess
      io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });

      console.log(`Player disconnected (${socket.id})`);

    }

    if (serverHost.socketId == socket.id) { // pass host on disconnect
      console.log('Host disconnected');
      if (playersArray.length >=1) {
        serverHost = playersArray[0];
        //console.log('server host applied to ' + serverHost.playerName);
        if (checkNum == -1) { // player can become host at anytime but wont have popup if game is started
          setTimeout(function(){
            io.to(serverHost.socketId).emit('serverHost')
        }, 2000);
        }


      } else {
        serverHost = '';
      }
      
    }

    // console.log(socket.rooms); // the Set contains at least the socket ID

  });

  socket.on('disconnect', () => {
    
//

  });


  socket.join("room-"+roomno); //join room

  io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });


  socket.on('chat', function(data){
    io.sockets.emit('chat', data)
  });



  // Button passthrough
/*
  socket.on('showVote', function(){
    playerButtons = functions.groupVoteList(); // get buttons
      for (i = 0; i < playersArray.length; i++) { // emit buttons to all players
        io.to(playersArray[i].socketId).emit('showVote', { buttonParse: playerButtons });
      }
  });
*/
  socket.on('exitVote', function(data){
    if (data.vote !== '') {// validation

      player = playersArray[functions.getPlayerBySocket(socket.id)];
      
      if (player !== undefined && player !== null) {
      player.playerVotesFor = data.vote;
      

      console.log('playerVote updated to:' + player.playerVotesFor);
    }

      socket.emit('exitVote') // validation

    } else {console.log('vote u dummy');}
  });

  socket.on('serverHost', function(){
    
    if (socket.id == serverHost.socketId) {
      socket.emit('serverHost')
    }
  });

  socket.on('showCard', function(){
    socket.emit('showCard')
  });

  socket.on('exitCard', function(){
    socket.emit('exitCard')
  });

  socket.on('exitEvent', function(){
    socket.emit('exitEvent')
  });

  socket.on('exitGameSetup', function(){
    socket.emit('exitGameSetup')
  });




  socket.on('userSubmit', function(data){

    socket.emit('exitUsername');


    var socketExists = function() {
      for (i = 0; i < socketArray.length; i++) { 
        if(socketArray[i] == socket.id){
          return true;
        }
      }
    }

    if (socketExists() == true) {
      // Update player name
      //console.log(`Allready Exists`);
      //functions.userCreate(socket.id, data.user)

      var player = playersArray[functions.getPlayerBySocket(socket.id)];
      console.log(`${player.playerName} username -> ${data.user}`);
      player.playerName = data.user;
      socket.emit('header', { header: `Welcome to the game <i>${data.user}</i>` });
      io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });

    } else {
      // Create new player
      console.log(`Does not exist yet, something is broken :(`);
      console.log(socketArray.length);
      functions.userCreate(socket.id);
      io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
    }

/*
    io.sockets.emit('chat', { message: functions.userCreate(socketArray[socketExists()], data.user) }); // use this to update name of existing player instead of just creating one
    socket.emit('header', { header: `Welcome to the game <i>${data.user}</i>` });
    io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
*/
  });

  socket.on('gameBtn', function(data){
    checkNum++;
    srv.emit('gameStart', {

      checkNum: checkNum,
      lobbyDuration: data.lobbyDuration,
      nightDuration: data.nightDuration,
      dayDuration: data.dayDuration,
      groupVoteDuration: data.groupVoteDuration,
      
      mafiaInput: data.mafiaInput,
      doctorInput: data.doctorInput,
      detectiveInput: data.detectiveInput,
      breadmanInput: data.breadmanInput

    });

  }); 


}); // socket connections end






srv.on('gameStart', function(data){ // game logic 2.0
  
  checkNum = data.checkNum;

  var groupVoteDuration = data.groupVoteDuration;

  if (checkNum == 0) {
        
    let phase = functions.phaseArray;

    // Accept custom durations over minimum values

    if (data.lobbyDuration >= 1)      {phase[0].phaseDuration = data.lobbyDuration}
    if (data.nightDuration >= 1)      {phase[1].phaseDuration = data.nightDuration}
    if (data.dayDuration >= 1)        {phase[2].phaseDuration = data.dayDuration}
    if (data.groupVoteDuration >= 1)  {phase[3].phaseDuration = data.groupVoteDuration}


      // put values into rolesavailable array

    if (data.mafiaInput > 0) {functions.availableRolesInit(data.mafiaInput, 'mafia')}
    if (data.doctorInput > 0) {functions.availableRolesInit(data.doctorInput, 'doctor')}
    if (data.detectiveInput > 0) {functions.availableRolesInit(data.detectiveInput, 'detective')}
    if (data.breadmanInput > 0) {functions.availableRolesInit(data.breadmanInput, 'breadman')}

    


    //srv.emit(`roel`,  { phase: phase[0] }); // Add custom roles to init role
    srv.emit(`phaseStart`,  { phase: phase[0] }); // Begin the game in Lobby
      

  } else  {console.log(`Error: Gamestart attempted x${checkNum} `)}
});

srv.on('phaseStart', function(data){ // functions.Night.phaseText || (phaseName, phaseTitle, phaseText, phaseDuration, phaseTrigger)

  var phase = data.phase;

  srv.emit('timerStart',  { phase: phase });
  srv.emit('phaseEnd',    { phase: phase });

});

srv.on('roleInit', function() {

  functions.fillCivilians();
  functions.initRoleAssign();
  //functions.initTeamAssign();
  console.log('fin');

  var socketArray = Object.keys(io.sockets.sockets);

    for (i = 0; i < socketArray.length; i++) { 
      var player = playersArray[functions.getPlayerBySocket(socketArray[i])];
      io.to(player.socketId).emit('roleInit', {
        name: player.playerName,
        role: player.playerRole
      });
    }

});

srv.on('timerStart', function(data){// update timers once immediately
  var phase = (data.phase);
  var time = (phase.phaseDuration);


  console.log(`${data.phase.phaseName} Started`);


  io.sockets.emit('timerUpdate', {
    timeLeft: time,
    phaseTitle: phase.phaseTitle
  });

    clearTimeout(phaseTimer);
  phaseTimer = setInterval(function(){// update every second
    if (time === 0 ) {
      clearTimeout(phaseTimer);
      time = (phase.phaseDuration);
      return;
  } else
    time -=1
    io.sockets.emit('timerUpdate', {
      timeLeft: time,
      phaseTitle: phase.phaseTitle
    });
  }, 1000);
});



srv.on('startVote', function(data){
  
  // Create target array
  const targetArray = [];
  const votesArray = [];

  if (data.target == 'all') { // Get players in array
    console.log('vote targetting all');
    for (i=0; i < playersArray.length; i++) {
    targetArray.push(functions.playersArray[i]);
  }


} else  {
  console.log(`vote targetting ${data.target}`);
  for (i=0; i < playersArray.length; i++) {
    if (playersArray[i].playerRole == data.target) {
    targetArray.push(functions.playersArray[i]);
    }
  }
}



for (i=0; i < targetArray.length; i++) { // Create buttons
    const buttonsArray = [];
  for (x=0; x < playersArray.length; x++) { // put players into a buttons array

    if (data.target == 'doctor') {
      buttonsArray.push(functions.playersArray[x]); // All players
    } else {

      if (targetArray[i].socketId !== playersArray[x].socketId) {
        buttonsArray.push(functions.playersArray[x]); // Except self
      }

    }
    


  }

  var playerButtons = '';
  for (y = 0; y < buttonsArray.length; y++) {
      var name = buttonsArray[y].playerName;
      var ID = buttonsArray[y].playerId;
      playerButtons += `<button class='button' id = '${ID}' onclick='getPlayerVote()'> ${name} </button>`;
  }
  io.to(targetArray[i].socketId).emit('showVote', { buttonParse: playerButtons }); // Push buttons to player
}



  // set time out phase duration to gather results and enact event

  voteTimeOut = setTimeout(function(){
    // push votes into an array and refresh vote object

    for (i = 0; i < targetArray.length; i++) {
      var playerVote = targetArray[i].playerVotesFor;
      if (playerVote !== '' && playerVote !== undefined) {
        votesArray.push(playerVote);
        targetArray[i].playerVotesFor = '';
      }
    }   

    var voteMode = functions.getMode(votesArray);


    if (votesArray === undefined || votesArray === null) { // no votes
      console.log('no votes received');
      return;
    } else if (voteMode >= 0 && voteMode.length == 1) { // modal vote


      console.log('target ' + voteMode);

    } else if (voteMode.length > 1) { // multimodal vote

      return;
/*
      console.log('stopped time due to a drawn vote');
      clearTimeout(phaseTimeOut);
      console.log(data.phase.phaseName); // current phase

      //srv.emit(`phaseStart`,  { phase: phase }); // Next Phase
*/
    }

    var player = playersArray[functions.getPlayerById(voteMode)];


    if (player !== undefined && player !== null) {


    if (data.action == 'kill') {
      
      player.killTarget = true;
      console.log(player.playerName + ' targeted for death');

    }



    if (data.action == 'protect') {

      player.protectTarget = true;
      console.log(player.playerName + ' targeted for protection');

    }



    if (data.action == 'bread') {

      console.log(player.playerName + ' targeted for bread');

    }



    if (data.action == 'suspect') {
      

      //popup here

    }

  }


  }, data.phase.phaseDuration*1000); // after this long
}); 



srv.on('actionVote', function(data){ // currently a kill player event

var deaths = false;

  for (i = 0; i < playersArray.length; i++) {
    

    if (playersArray[i].killTarget == true && playersArray[i].protectTarget == false) {

      console.log('killed: ' + playersArray[i].playerName);
      functions.playersKilled.push(playersArray[i])
      io.to(playersArray[i].socketId).emit('exitVote');
      io.to(playersArray[i].socketId).emit('showEvent', { title: 'You Died', text: `Sorry <b>${playersArray[i].playerName}</b> you've died, you can continue spectating though c:` });
      playersArray.splice(i,1);
      deaths = true;
        
    }

    if (playersArray[i] !== null && playersArray[i] !== undefined) {
      console.log(playersArray[i].playerName + 'cleared');
      playersArray[i].killTarget = false;
      playersArray[i].protectTarget = false;

    }


  }

  if (deaths == false) {
    console.log('no players were killed');
  }

  io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });


});



srv.on('phaseEnd', function(data){ // on phase end wait x time then start next phase
// use the data.phase for current phase otherwise assume it's next phase

    // Execute specific code on phase start.

    if (data.phase.phaseName == 'lobby'){
      
      

    } else if (data.phase.phaseName == 'night'){ // for loop through the roles object instead of listing them here?

     // if (gVcounter > 0) { // no group vote round 1
      //srv.emit('actionVote', {}); // action group vote
      //}

      srv.emit(`startVote`, { phase: data.phase, target: 'mafia', action: 'kill', type: 'group' }); // type: mafia

      srv.emit(`startVote`, { phase: data.phase, target: 'doctor', action: 'protect', type: 'group' }); // type: doctor

      srv.emit(`startVote`, { phase: data.phase, target: 'detective', action: 'suspect', type: 'single' }); // type: detective

      srv.emit(`startVote`, { phase: data.phase, target: 'breadman', action: 'bread', type: 'single' }); // type: breadman
  

    } else if (data.phase.phaseName == 'day'){

      //srv.emit('actionVote', {}); // action night votes  

    } else if (data.phase.phaseName == 'vote'){

      srv.emit(`startVote`, { phase: data.phase, target: 'all', action: 'kill', type: 'group' }); // type: groupVote
      gVcounter++

    }

    





    clearTimeout(phaseTimeOut); // clearTimeout init
  phaseTimeOut = setTimeout(function(){
    clearTimeout(phaseTimeOut); // clearTimeout complete
    
    var phase = functions.phaseArray[phaseNumber];


    // Execute specific code on phase end.

    if (data.phase.phaseName == 'lobby'){

      allowPlayers = false;
      console.log('end of lobby, allowPlayers now false');
      srv.emit(`roleInit`); // 

      

    } else if (data.phase.phaseName == 'night'){
      
      srv.emit('actionVote', {}); // action night vote  
      console.log('VOTE ACTIONS');

    } else if (data.phase.phaseName == 'day'){
      
      

    } else if (data.phase.phaseName == 'vote'){
     
      srv.emit('actionVote', {}); // action group vote  
      console.log('VOTE ACTIONS');

    }

    // Hide voting window every round
    for (i = 0; i < playersArray.length; i++) { // close voting for all players
      io.to(playersArray[i].socketId).emit('exitVote');
    }


    // Round System, cycles through main phases until max rounds is hit. Need to implement win condition check to break cycle earlier

    if (phaseNumber < functions.phaseArray.length -1) {
      //console.log(`Phase: ${phaseNumber}, Round: ${roundNumber}`);
      phaseNumber++
      srv.emit(`phaseStart`,  { phase: phase }); // Next Phase
      
      
    } else if (roundNumber < maxRounds) { // Next round  
      //console.log(`Round ${roundNumber} Complete!`);
      //console.log(`Phase: ${phaseNumber}, Round: ${roundNumber}`);
      roundNumber++;
      phaseNumber = 1;
      srv.emit(`phaseStart`,  { phase: phase }); // Next Phase
    } else { // End Game
      //console.log(`Phase: ${phaseNumber}, Round: ${roundNumber}`);
      console.log('Game Over');
      roundNumber = 0;
      phaseNumber = 0;
      checkNum = -1 // game ended and can be restarted now
    }

  }, data.phase.phaseDuration*1000); // after this long
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))