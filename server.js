const PORT = process.env.PORT || 3000;

const path = require('path');
const express = require('express');
const app = express();

const httpServer = require("http").createServer(app);
const options = { /* ... */ };
const io = require("socket.io")(httpServer, options);

var bodyParser = require('body-parser');
var EventEmitter = require("events").EventEmitter;

var errorhandler = require('errorhandler');

var crypto = require("crypto");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



// Server state variables
var checkNum = -1;
var phaseNumber = 1; // used to trigger next phase in a cycle, not reliable as the current value
var roundNumber = 1;
// var maxRounds = 500; // Must be optional
var serverHost;
var roomno = 1; // room variable
var socketArray = []; // global sockets array
var actionArr = [];

//chatRoom arrays and chatRooms object container
var generalChatRoom = [];
var spectatorChatRoom = [];
var mafiaChatRoom = [];
var doctorChatRoom = [];
var infectedChatRoom = [];
var chatRooms = { generalChatRoom:generalChatRoom, spectatorChatRoom:spectatorChatRoom, mafiaChatRoom:mafiaChatRoom, doctorChatRoom:doctorChatRoom, infectedChatRoom:infectedChatRoom };
// `${roomName}chatRoom`

var allowPlayers = true;

var phaseTimer;
var phaseTimeOut;
// var voteTimeOut;



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
/*app.get("/dev", function(req, res){
	res.render("index");
});*/

process.on('uncaughtException', function (exception) {
  console.log(exception); // to see your exception details in the console
  // if you are on production, maybe you can send the exception details to your
  // email as well ?
});


app.use(express.static(path.join(__dirname, "/public")));
//console.log(crypto.randomBytes(20).toString('hex'));

io.on('connection', socket => { // connection start

  if (allowPlayers == true) { // Create unnamed player using socketID

    socket.emit('header', { header: 'Welcome.' });

    functions.userCreate(socket.id);
    socketArray.push(socket.id);
    
    if (serverHost === undefined || serverHost === '') { // first player becomes host
      serverHost = playersArray[functions.getPlayerBySocket(socket.id)];
      functions.updateLead(serverHost.socketId);
      setTimeout(function(){
        if (socket.id == serverHost.socketId) {
          socket.emit('serverHost')
        }
      }, 2000);
    }

    io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });

  } else { // Connect as spectator

    console.log(`Spectator connected 1`);
    // push number of specs to app.js?
    io.to(socket.id).emit('showEvent', { title: 'Joined as spectator', text: `You will be able to play the next round.`, kill: true });

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
        functions.updateLead(serverHost.socketId);
        io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
        if (checkNum == -1) { // player can become host at anytime but wont have popup if game is started
          setTimeout(function(){
            io.to(serverHost.socketId).emit('serverHost')
        }, 2000);
        }
      } else {
        serverHost = '';
      }
      
    }

    if (socketArray.length == 0) {
      srv.emit('resetGame');
      console.log('resetGame (0 players on disconnect)');
      return;
}

    // console.log(socket.rooms); // the Set contains at least the socket ID

  });

  socket.on('disconnect', () => {
    
//

  });


  socket.join("global-"+roomno); //join room

  socket.on('joinGlobal', function(){
    socket.join("global-"+roomno); 
  });

  io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });


  socket.on('chat', function(data){

    var message = data.message;
    var playerName = playersArray[functions.getPlayerBySocket(socket.id)].playerName;
    var roomName = playersArray[functions.getPlayerBySocket(socket.id)].currentChatRoom;
    var chatRoom = chatRooms[`${roomName}ChatRoom`];

    if (chatRoom !== undefined && chatRoom !== null) {
      chatRoom.push(`<p> ${playerName}: ${message}</p>`);
    }

    for (i=0; i < playersArray.length; i++) {
      if (playersArray[i].currentChatRoom == roomName) {
        io.to(playersArray[i].socketId).emit('chatRoomUpdate', { chatRoom });
      }
    }
  });





  socket.on('voteUpdate', function(data){
    var index = data.index;
    var btnsArray = data.btnsArray;
    var playerSelected = playersArray[functions.getPlayerBySocket(btnsArray[index].socketId)]; // get player voted for
    var player = playersArray[functions.getPlayerBySocket(socket.id)];

    console.log(`${player.playerName} clicked button of ${playerSelected.playerName}`);

    /*
    if (player.playerVotesFor !== '' && playerSelected.playerVotes !== null && playerSelected.playerVotes !== undefined) { // if this is an additional vote selection
      var previousSelected = playersArray[functions.getPlayerBySocket(player.playerVotesFor.socketId)];
      previousSelected.playerVotes--; // decrement a vote from previous clicked
      playerSelected.playerVotes++; // increment selected players votes
      player.playerVotesFor = playerSelected.playerId;
    } else {
      playerSelected.playerVotes++; // increment selected players votes
      player.playerVotesFor = playerSelected.playerId;
    }
*/player.playerVotesFor = playerSelected.playerId;

    console.log(`${player.playerName} votes for: ${player.playerVotesFor}`);
    io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
  });
  





  socket.on('exitVote', function(){
    var player = playersArray[functions.getPlayerBySocket(socket.id)];

    if (player.playerVotesFor !== '') {// validation
      socket.emit('exitVote')
    } else {
      console.log('Player did not vote');
    }
  });

  socket.on('serverHost', function(){
    
    if (socket.id == serverHost.socketId) {
      socket.emit('serverHost');
    }
    io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
  });

  /*
  socket.on('showCard', function(){
    socket.emit('showCard')
  });
*/
  socket.on('exitCard', function(){
    socket.emit('exitCard');
  });

  socket.on('exitEvent', function(){
    socket.emit('exitEvent');
  });

  socket.on('exitGameSetup', function(){
    socket.emit('exitGameSetup');
  });

  socket.on('createRoom', function(data){
    var roomId = crypto.randomBytes(4).toString('hex');
    var roomName = data.roomName;

    /*socket.join(roomId);*/
    console.log(roomName + "  -  " + roomId);

    socket.emit('createRoom', {
      roomId: roomId,
      roomName: roomName
    });
  });


  // new player




  socket.on('joinGame', function() { // on clicking the "join" menu button, either reconnect the game or join a new one
    if (functions.playerExists(socket.id) !== true && allowPlayers == true) { // new player allowed to join
      functions.userCreate(socket.id);
      io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });

    } else if (functions.playerExists(socket.id) !== true && allowPlayers == false) { // new player as spectator
      console.log(`Spectator connected 2`);
      // push number of specs to app.js?
      io.to(socket.id).emit('showEvent', { title: 'Joined as spectator', text: `You will be able to play the next round.`, kill: true });
     }

    if (serverHost === undefined || serverHost === '') { // first player becomes host
      serverHost = playersArray[functions.getPlayerBySocket(socket.id)]
      functions.updateLead(serverHost.socketId);
      io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
      setTimeout(function(){
        if (socket.id == serverHost.socketId) {
          socket.emit('serverHost')
        }
      }, 2000);
    }
    // console.log('after ' + playersArray);
    console.log(`${socketArray.length} instances connected`);
  });


  socket.on('chatroomsVerify', function(data){ // client to server then server responds with verification

    //console.log(data.index);


    if (allowPlayers === false) { // chats only functional during game
      var playerRooms = functions.chatroomsGet(socket.id); // get current room access
      var roomTrigger = playerRooms[`${data.index}`]; // get room allowed (not verified, FORCED)
      var status;
      if (roomTrigger !== '') {
        status = true;
        var player = playersArray[functions.getPlayerBySocket(socket.id)];
        player.currentChatRoom = roomTrigger;
        var chatRoom = chatRooms[`${player.currentChatRoom}ChatRoom`];

        socket.emit('chatRoomUpdate', { chatRoom });
        //socket.emit(`chatRoomActiveIcon`, { chatRoom });


        //io.to().emit('chatRoomUpdate', {  });
        
      } else {
        status = false; // reject any unexpected selections
      }

      socket.emit('chatroomsVerify', {
        verified: status,
        index: data.index
      })

    }
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

      var player = playersArray[functions.getPlayerBySocket(socket.id)];
      console.log(`${player.playerName} username -> ${data.user}`);
      player.playerName = data.user;
      // socket.emit('header', { header: `Welcome to the game <i>${data.user}</i>` });
      console.log(player.playerName + player.playerRole);
      if (player.playerRole == "") {
        console.log('sent playerUIupdate');
        io.to(player.socketId).emit('nameUIUpdate', {
          name: player.playerName,
        });      
      } else {
        console.log('sent roleUIupdate');
        io.to(player.socketId).emit('roleUIUpdate', {
          name: player.playerName,
          role: player.playerRole
        });      
      }
      io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
    } else {
      console.log('elsetriggered12');
    }
  });

  socket.on('gameBtn', function(data){
    checkNum++;
    if (socket.id == serverHost.socketId) { // validate that serverhost made this request
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
    }
  }); 


}); // socket connections end






srv.on('gameStart', function(data){ // game logic 2.0
  
  checkNum = data.checkNum;

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

  var revoteValues = ['','',''];
    if (data.rVvals !== ['','',''])      {revoteValues = data.rVvals} // If revote values are specified, update them
  
  var voteMode = [''];
    if (data.modes !== [''])      {voteMode = data.modes}

  var phase = data.phase;

  srv.emit('timerStart',  { phase: phase });
  srv.emit('phaseEnd',    { phase: phase, rVvals: revoteValues, modes: voteMode });

});

srv.on('roleInit', function() {

  functions.fillCivilians();
  functions.initRoleAssign();

  for (i = 0; i < playersArray.length; i++) { // each socket array, get the player ID then put that into the playersArray
    var player = playersArray[i];
    //if (player !== undefined && player !== null) { // causing the role UI to not update on second game
    console.log('sent header update to '+ player.playerName);
    io.to(player.socketId).emit('roleUIUpdate', {
      name: player.playerName,
      role: player.playerRole
    });  
  }

});

srv.on('chatroomsInit', function() {
  for (i = 0; i < playersArray.length; i++) { 
  var socket = playersArray[i];
  var playerRooms;

  //if (socket !== undefined && socket !== null) { testing with this out, if no errors then keep it out as seen above
    playerRooms = functions.chatroomsGet(socket.socketId);
    io.to(socket.socketId).emit('chatroomsInit', {
      playerRooms: playerRooms
    });
  //}
 }
});

srv.on('detectiveInit', function() {
  for (i = 0; i < playersArray.length; i++) { 
  var socket = playersArray[i];
  if (socket !== undefined && socket.playerRole == 'detective') {
    io.to(socket.socketId).emit('detectiveInit');
  }
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
    time -=1;
    io.sockets.emit('timerUpdate', {
      timeLeft: time,
      phaseTitle: phase.phaseTitle
    });
    //console.log('tick');
  }, 1000);
});

  // start revote timer





  // start new vote

// target is modes parsed

// duration is duration



  // start new vote with only the multiple modes available to same targetted voters



  // if modal length > 1

// do original action to target

  
  // if multimodal length > 1

// if group vote logic - choose random of the modes

// if role based logic - 


  // else if no vote length = 0

// flip a table idk



srv.on(`startVote`, function(data){

  var playersAliveArr = functions.playersAlive();

  if (data.target !== 'all') { // if custom role is not in the game currently, don't send or action a vote.
    if (functions.roleExists(data.target) !== true) {
      return;
    }
  }

  if (data.modes !== [''])      {var revoteMode = data.modes}
  
  // Create target array
  const targetArray = [];
  const votesArray = [];


  if (data.target == 'all') { // Get players in array
    console.log('vote targetting all');
    for (i=0; i < playersAliveArr.length; i++) {
    targetArray.push(playersAliveArr[i]);
  }


} else  {
  console.log(`vote targetting ${data.target}`);
  for (i=0; i < playersAliveArr.length; i++) {
    if (playersAliveArr[i].playerRole == data.target) {
    targetArray.push(playersAliveArr[i]);
    console.log(`${data.target} vote targetted ${playersAliveArr[i].playerName}`);
    }
  }
}



var actionTrigger = function(playerVoted, playerSelf) {
  
  var player = playersArray[functions.getPlayerById(playerVoted)];

  // not working here
  console.log(`debugger ${player}`)
  console.log(`debugger2 ${player.playerName}`)

  if (player !== undefined && player !== null) {
  
  if (data.action == 'kill') { player.killTarget = true; console.log(player.playerName + ' targeted for death'); }

  if (data.action == 'protect') { player.protectTarget = true; console.log(player.playerName + ' targeted for protection'); }

  if (data.action == 'bread') { console.log(player.playerName + ' targeted for bread');

    var title = 'A crumble offering...';
    var text = `A loaf of bread and a trail of crumbs.<br>The Breadman strikes again!`;
    var html1 = `<p class='actionHeader'>${title}</p>`;
    var html2 = `<p class='actionText'>${text}</p>`;
    actionArr.unshift(html1, html2);

    io.to(player.socketId).emit('actionUpdate', { actionArr });
  }

  if (data.action == 'suspect') { 
    var susState = functions.isSus(player.playerRole);
    var sus = 'unknown';
    if (susState == true) {sus = 'You may be onto something...'}
    else {sus = 'Nothing out of the ordinary...'}
  

    console.log(player.playerName + ' targeted as suspect');
    console.log(functions.isSus(player.playerRole));
    //console.log(playerSelf.socketId + ' id');
    io.to(playerSelf.socketId).emit('showEvent', {
      title: 'A closer look...',
      text: `You suspected ${player.playerName},<br>${sus}`,
      kill: false });

    }
  } 
}
/*
var getButtonsFromArray = function(buttonsArray) { // convert buttons array into HTML
  var playerButtons = '';
  for (y = 0; y < buttonsArray.length; y++) {
      var name = buttonsArray[y].playerName;
      var ID = buttonsArray[y].playerId;
      playerButtons += `<button class='playerButton' id = '${ID}' onclick='getPlayerVote()'> ${name} </button>`;
  }    
  return playerButtons;
}*/


if (data.phase.phaseName == 'revote') {

  for (i=0; i < targetArray.length; i++) { // Create button
    const buttonsArray = [];
    
    for (x=0; x < playersAliveArr.length; x++) { // put players into a buttons array
      for (y=0; y < revoteMode.length; y++) { 
        if (revoteMode[y] == playersAliveArr[x].playerId) {
          
          buttonsArray.push(playersAliveArr[x]); // If player is a revote mode then push into buttons array
        }
      }
    }
    // io.to(targetArray[i].socketId).emit('showVote', { buttonParse: getButtonsFromArray(buttonsArray) }); // Push buttons to player
    io.to(targetArray[i].socketId).emit('showVote', { buttonParse: buttonsArray }); // Push buttons to player
  }

} else {

  for (i=0; i < targetArray.length; i++) { // Create button array
  const buttonsArray = [];

    for (x=0; x < playersAliveArr.length; x++) { // put players into a buttons array

      if (data.target == 'doctor') {
        buttonsArray.push(playersAliveArr[x]); // All players
      } else {

        if (targetArray[i].socketId !== playersAliveArr[x].socketId) {
          buttonsArray.push(playersAliveArr[x]); // Except self
          
        }
      }
    }
    // io.to(targetArray[i].socketId).emit('showVote', { buttonParse: getButtonsFromArray(buttonsArray) }); // Push buttons to player
    io.to(targetArray[i].socketId).emit('showVote', { buttonParse: buttonsArray }); // Push buttons to player
  }
}



  // set time out phase duration to gather results and enact event

  voteTimeOut = setTimeout(function(){

    // push votes into an array and refresh the vote property

    // w-hoiam breaks on group votes as it is trying to define multiple targets to the value then doing .socketid is not a property of all the targets as an array

    if (data.type == 'group') { // group vote system. shared votes array with a votemode variable to decide logic

      for (i = 0; i < targetArray.length; i++) {
        console.log(i+' of ' + targetArray.length);
        var playerVote = targetArray[i].playerVotesFor;
        //var player = functions.getPlayerBySocket(targetArray[i].socketId);
       

        if (targetArray[i] !== '' && targetArray[i] !== undefined && targetArray[i] !== null) {
          console.log(`${i} tester2 ${functions.getPlayerBySocket(targetArray[i].socketId)}`); // ID of player voting
          console.log(`${targetArray[i]}`);
        }

        console.log(`debugger3000`);

        if (playerVote !== '' && playerVote !== undefined) {
          votesArray.push(playerVote);
          console.log(`${i} debugger3 ${playerVote}`);
        }
      }

      var voteMode = functions.getMode(votesArray, '');
      console.log(`${i} debugger4 ${voteMode}`);


      if (voteMode.length > 1 && data.phase.phaseName == 'revote') { // multimodal revote logic

        if (data.target == 'all') {
          console.log('revote targetting all');
          // skip the vote
          //console.log('skipped the vote group revote');
          return;
        } else {
          console.log(`vote targetting ${data.target}`);
          // select random of revoteMode array
        }
        
      }


      if (voteMode.length > 1 && data.phase.phaseName !== 'revote') { // multimodal vote
        console.log(data.phase.phaseName);
        srv.emit(`phaseStart`,  { phase: functions.phaseArray[4], rVvals: [data.target, data.action, data.type], modes: voteMode }); // Start a revote (also parse through values in an array)
        return;

      } else { // can turn this into a function to call at the end of multimodal revote logic
        if (voteMode.length == 1){
          actionTrigger(voteMode, targetArray[i]);
          return;
        } else {
          console.log('triggered action filter');
        }
        
      }

    } else if (data.type == 'single') { // single vote system. for each player in target array loop the logic for a vote to trigger (seperate variable values and results)

      console.log('single type triggered')

      for (i=0; i < targetArray.length; i++) { // get player's vote
        var voteSelection;
        var playerVote = targetArray[i].playerVotesFor;

        console.log(`${targetArray[i].playerName} votes for ${playerVote}`); // debug

        if (playerVote !== '' && playerVote !== undefined) {
          voteSelection = playerVote;
          console.log(`sldkjhfblkasjdbfkljasdhfkjas`);
        }
        actionTrigger(voteSelection, targetArray[i]); // action player's choice
        return;
      }

    }

  } 
, data.phase.phaseDuration*1000); // after this long
}); 



srv.on('actionVote', function(){ // currently a kill player event

var deaths = false;

  for (i = 0; i < playersArray.length; i++) {

    //console.log(i);
    
    if (playersArray[i].killTarget == true && playersArray[i].protectTarget == false) {

      console.log('killed: ' + playersArray[i].playerName);
      functions.playersKilled.push(playersArray[i]);
      io.to(playersArray[i].socketId).emit('exitVote');

      var title = 'Player Died';
      var text = `The journey has ended for: ${playersArray[i].playerName}`;
      var html1 = `<p class='actionHeader'>${title}</p>`;
      var html2 = `<p class='actionText'>${text}</p>`;
      actionArr.unshift(html1, html2);
      
        for (y = 0; y < playersArray.length; y++) {      
          io.to(playersArray[y].socketId).emit('actionUpdate', { actionArr });
        }
      io.to(playersArray[i].socketId).emit('showEvent', { title: 'You Died', text: `Sorry <b>${playersArray[i].playerName}</b> you've died, you can continue spectating though c:`, kill: true });
      
      playersArray[i].playerStatus = 'dead';

        //console.log('player has been killed via an actionVote');
        //console.log(`player killed previously had access to: ${functions.chatroomsGet(playersArray[i].socketId)}`);


        // chatroomEdit

        var playerRooms = functions.getRoomsBySocket(playersArray[i].socketId); // get current chatrooms object

        playerRooms.roomMain = 'spectator'; // manually specify new room access permission
        playerRooms.roomRole = ''; // manually specify new room access permission
        playerRooms.roomPlus = ''; // manually specify new room access permission
        
        console.log(`player killed now has access to: ${functions.chatroomsGet(playersArray[i].socketId)}`);

        playersArray[i].currentChatRoom = 'spectator'; // set current active room to spectator chat
        var chatRoom = chatRooms[`${playersArray[i].currentChatRoom}ChatRoom`]; // set spectatorChatRoom array as chatRoom variable
        
        io.to(playersArray[i].socketId).emit('chatRoomUpdate', { chatRoom }); // push spectator chat to client

        var playerRooms2 = functions.chatroomsGet(playersArray[i].socketId); // update UI html header (from 'srv.emit-chatroomsInit')
          io.to(playersArray[i].socketId).emit('chatroomsInit', {
            playerRooms: playerRooms2
          });

          //io.to(playersArray[i].socketId).emit('chatroomBtn0Highlight');
        


      //playersArray.splice(i,1); // this 'kills' the player by removing them from the playersArray MAJOR BREAKPOINT (roles3.0 prep)
      deaths = true;
    }
    playersArray[i].killTarget = false;
    playersArray[i].protectTarget = false;
    playersArray[i].playerVotesFor = '';
    console.log(playersArray[i].playerName + 'cleared');
  }



  if (deaths == false) {
    console.log('no players were killed');
  }

  io.sockets.emit('playerList', { playerListParse: functions.playerListUpdate() });
});



srv.on('phaseEnd', function(data){ // on phase end wait x time then start next phase
// use the data.phase for current phase otherwise assume it's next phase

    if (data.rVvals !== ['','',''])      { var revoteValues = data.rVvals } // If revote values are specified, update them
    if (data.modes !== [''])      {var voteMode = data.modes}

    

  // Execute specific code on phase start.

  if (data.phase.phaseName == 'revote') { // either it's a revote or it's a standard.

    for (i = 0; i < playersArray.length; i++) {
    io.to(playersArray[i].socketId).emit('exitVote'); // clear residual votes (not actioned)
    }

    srv.emit(`startVote`, { phase: data.phase, target: revoteValues[0], action: revoteValues[1], type: revoteValues[2], modes: voteMode }); // revote voting triggered using orginal variables


  } else if (data.phase.phaseName == 'lobby') {

  } else if (data.phase.phaseName == 'night') { // for loop through the roles object instead of listing them here?

    srv.emit(`startVote`, { phase: data.phase, target: 'mafia', action: 'kill', type: 'group' }); // type: mafia
    srv.emit(`startVote`, { phase: data.phase, target: 'doctor', action: 'protect', type: 'group' }); // type: doctor
    srv.emit(`startVote`, { phase: data.phase, target: 'detective', action: 'suspect', type: 'single' }); // type: detective
    srv.emit(`startVote`, { phase: data.phase, target: 'breadman', action: 'bread', type: 'single' }); // type: breadman

  } else if (data.phase.phaseName == 'day') {

  } else if (data.phase.phaseName == 'vote') {

    srv.emit(`startVote`, { phase: data.phase, target: 'all', action: 'kill', type: 'group' }); // type: groupVote

  }

    
    clearTimeout(phaseTimeOut); // clearTimeout init
  phaseTimeOut = setTimeout(function(){
    clearTimeout(phaseTimeOut); // clearTimeout complete
    
    var phase = functions.phaseArray[phaseNumber];

      // Hide voting window every round
      for (i = 0; i < playersArray.length; i++) { // close voting for all players
        playersArray[i].playerVotes = 0;
        io.to(playersArray[i].socketId).emit('exitVote');
        // io.to(playersArray[i].socketId).emit('exitEvent'); //closes bread message instantly :(
      }

    // Execute specific code on phase end.

    if (socketArray.length == 0) {
      srv.emit('resetGame');
      console.log('resetGame (0 players round end)');
      return;
    }

    if (data.phase.phaseName == 'lobby'){

      allowPlayers = false;
      console.log('end of lobby, allowPlayers now false');
      srv.emit(`roleInit`);
      srv.emit(`chatroomsInit`);
      srv.emit(`detectiveInit`);


    } else if (data.phase.phaseName == 'night'){
      
      srv.emit('actionVote', {}); // action night vote

    } else if (data.phase.phaseName == 'day'){
    

    } else if (data.phase.phaseName == 'vote'){
     
      srv.emit('actionVote', {}); // action group vote 

    } else if (data.phase.phaseName == 'revote') { // revote end

      srv.emit('actionVote', {}); // action group vote

      console.log('revote ended');
    }





    // Round System, cycles through main phases until max rounds is hit. Need to implement win condition check to break cycle earlier

    console.log('winstatus2   '+ functions.winConditions());
   
    if (functions.winConditions() !== true) {

      if (phaseNumber < 3) {
        //console.log(`Phase: ${phaseNumber}, Round: ${roundNumber}`);
        phaseNumber++
        srv.emit(`phaseStart`,  { phase: phase }); // Next Phase
      
      } else { // Next round  
        //console.log(`Round ${roundNumber} Complete!`);
        //console.log(`Phase: ${phaseNumber}, Round: ${roundNumber}`);
        roundNumber++;
        phaseNumber = 1;
        srv.emit(`phaseStart`,  { phase: phase }); // Next Phase
      }
    }  
  
    if (functions.winConditions() == true) { // End Game
    //console.log(`Phase: ${phaseNumber}, Round: ${roundNumber}`);
    console.log('Game Over');


    if (functions.civilWin() == true) {
      io.sockets.emit('gameEndPopup', { title: 'Game Over', text: `The <i>civilians</i> have won`});

    } else if (functions.mafiaWin() == true) {
      io.sockets.emit('gameEndPopup', { title: 'Game Over', text: `The <i>Mafia</i> have won`});

    } else {
      io.sockets.emit('showEvent', { title: 'Game Over', text: `Somebody won the game`});
    }

    //vars

    // Display game over screen
    
    // Reset server variables

    // Reset client variables

    srv.emit('resetGame');
    console.log('resetGame (game over)');
    return;
  }


  }, data.phase.phaseDuration*1000); // after this long
});

srv.on('resetGame', function(){
  console.log('resetGame - triggered');

  // update:

  // action log

  // server variables to change

  serverHost = '';
  checkNum = -1 // game ended and can be restarted now
  phaseNumber = 1;
  roundNumber = 1;
  allowPlayers = true;
  


  
  chatRooms[`generalChatRoom`] = [];
  chatRooms[`spectatorChatRoom`] = [];
  chatRooms[`mafiaChatRoom`] = [];
  chatRooms[`doctorChatRoom`] = [];
  chatRooms[`infectedChatRoom`] = [];
  io.sockets.emit('chatRoomUpdateAll');
  
  // reset all client features:

  functions.resetPlayers();
  
  actionArr = []; // set action array to empty array
  io.sockets.emit('actionUpdate', { actionArr }); // update action array
  // detective/ role array = [];
  // update detective / role array
  io.sockets.emit('alertsClear'); // clear all alerts
  io.sockets.emit('exitEvent'); // close event message
  io.sockets.emit('closePanels');
  io.sockets.emit('header', { header: 'Welcome.' });
  io.sockets.emit('showNameIcon');

  setTimeout(function(){
    io.sockets.emit('timerUpdate', {
      timeLeft: 0,
      phaseTitle: 'Awaiting host...'
    });
  }, 1000);


  io.sockets.emit('exitGameSetup'); // close setup console
  io.sockets.emit('gameEndUI');
  io.sockets.emit('detectiveClear');
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));