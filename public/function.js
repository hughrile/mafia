//init variables
var playerRole = '';
var playerTeam = '';
var playerId = 0;
var playerVotes = this.playerVotes;
this.playerVotes = 0;

var playerVotesFor = this.playerVotesFor;
this.playerVotesFor = '';

/*
playerRole = '';
playerTeam = '';
playerStatus = "Alive";
*/

// ARRAYS
const playersArray = [];
const rolesArray = [];
const phaseArray = [];
const availableRoles = []; // for role inti
const suspectsRevealed = []; // for detective
const playersKilled = []; // for taxidermist to take over
const chatroomsArray = []; // stores chatrooms that a user has access to


// CLASSES

const Player = class {
    constructor(playerId, socketId, playerName, playerRole, playerTeam, playerVotes, playerVotesFor, killTarget, protectTarget){
        this.playerId = playerId;
        this.socketId = socketId;
        this.playerName = playerName;
        this.playerRole = playerRole;
        this.playerTeam = playerTeam;
        this.playerVotes = playerVotes;
        this.playerVotesFor = playerVotesFor;
        this.killTarget = killTarget;
        this.protectTarget = protectTarget;
        playerId = 0;
    }
}



const Phase = class { // class for storing phase information
    constructor(phaseName, phaseTitle, phaseText, phaseDuration, phaseNo){
        // Info
        this.phaseName = phaseName; //              {'Night'} Internal use
        this.phaseTitle = phaseTitle; //            {'Night Time'} Tool tips
        this.phaseText = phaseText; //              {'It's time to sleep! Keep one eye open though, the Mafia are out.'} Tool tips

        // Logic
        this.phaseDuration = phaseDuration; //      {50} Length in seconds, of current phase
        this.phaseNo = phaseNo; //                  {'1'} Current phase number
    }
}

// Phase init
var Lobby = new Phase(
    'lobby', 
    `The Lobby`, 
    `Waiting for the host to start the game...`, 
    90, 
    0
    );

var Night = new Phase(
    `night`, 
    `Night Time`, 
    `It's time to sleep! Keep one eye open though, the Mafia are out.`, 
    30, 
    1
    );

var Day = new Phase(
    `day`, 
    `Day Time`, 
    `phaseText`, 
    120, 
    2
    );

var Vote = new Phase( // Vote.phaseName = `vote`
    'vote', 
    `Voting Time`, 
    `Vote for a player to cast your suspicion, the most votes is cast out!`, 
    15, 
    3
    );

var Revote = new Phase( // Vote.phaseName = `vote`
    'revote', 
    `revoting Time`, 
    `A vote was tied! Try again`, 
    15, 
    4
    );

// Push phase objects into phaseArray
phaseArray.push(Lobby, Night, Day, Vote, Revote);


const Role = class { // class for storing role information
    constructor(roleName, roleTitle, roleText, roleAction, roleTeam, roleSus){
        // Info
        this.roleName = roleName; //                {'mafia'} Internal use
        this.roleTitle = roleTitle; //              {'The Mafia'} Tool tips
        this.roleText = roleText; //                {'Meany, meany, murder machiney'} Tool tips

        // Util
        this.roleAction = roleAction; //            {'kill'} CURRENTLY NOT USED

        // Logic
        this.roleTeam = roleTeam; //                {'Mafia'} Team that this role belongs to by default
        this.roleSus = roleSus; //                  {'Suspicious'} Result of a detective's interrigation
    }
}

var Civilian = new Role(
    'civilian',
    'A Civilian',
    `you're a normal peepl`,
    '',
    'innocent',
    false
    );

var Mafia = new Role(
    'mafia',
    'The Mafia',
    'Meany, meany, murder machiney',
    'kill', // night time
    'mafia',
    true
    );

var Detective = new Role(
    'detective',
    'The Detective',
    `you're a skilled detective, catch the mafia red handed!`,
    'suspect', // night time
    'innocent',
    false
    );

var Doctor = new Role(
    'doctor',
    'The Doctor',
    `you can protect somebody every night`,
    'protect', // night time
    'innocent',
    false
    );

var Gunman = new Role(
    'gunman',
    'The Gunman',
    'one shot, one kill. take them out before they take you out',
    'kill', // any time once
    'innocent',
    false
    );

var Madman = new Role(
    'madman',
    'The Madman',
    `if you're going out, may as well take someone with you`,
    'kill', // on death except night time
    'innocent',
    true
    );

var Breadman = new Role(
    'breadman',
    'The Breadman',
    'i give breads to u',
    'giveBread', // night time
    'innocent',
    false
    );

var Tpman = new Role(
    'tpman',
    'The Toilet Paper Man',
    'i give toilet paper in a time of need',
    'giveTp', // night time
    'innocent',
    false
    );

var Jester = new Role(
    'jester',
    'The Jester',
    `Try and take the heat. If you take a bullet, you take the game!`,
    '', // no default role action (IMMEDIATELY WINS ON DEATH)
    'jester',
    false
    );

var Taxidermist = new Role(
    'taxidermist',
    'The Taxidermist',
    'Monkey see, monkey do.',
    'mimic', // mimic dead player's role during same phase as their death
    'innocent',
    false
    );

var Infectleader = new Role(
    'infectleader',
    'Infected Leader',
    `gang up chasey, and you're it!`,
    '', // unknown
    'infected',
    true
    );

// Push phase objects into phaseArray
rolesArray.push(
    Civilian,
    Mafia,
    Detective,
    Doctor,
    Gunman,
    Madman,
    Breadman,
    Tpman,
    Jester,
    Taxidermist,
    Infectleader
);

const Room = class { // class for storing phase information
    constructor(socketId, roomMain, roomRole, roomPlus){
        // Info
        this.socketId = socketId; //                Socket Id
        this.roomMain = roomMain; //                general / (breakout)
        this.roomRole = roomRole; //                mafia & jester / doctor
        this.roomPlus = roomPlus; //                (infected)          
    }
}

var userCreate = function(socketId){

    var x = new Player(playerId, socketId, `Player ${playerId}`, playerRole, playerTeam, playerVotes, playerVotesFor, false, false);
    playersArray.push(x);
    console.log(`Player ${playerId} connected (${socketId})`); // debug only
    output = `Player ${playerId} connected (${socketId})`;
    playerId++;
    return output;
}



// Index searching

var getRoleNumByName = function(name) {
    for(i = 0;i < rolesArray.length;i++){
        if(rolesArray[i].roleName == name){
          return i;
          
      }
}
}

var getPlayerBySocket = function(socketID) {
      for(i = 0;i < playersArray.length;i++){
          if(playersArray[i].socketId == socketID){
            return i;
        }
  }
}

var getRoomsBySocket = function(socketID) {
    for(i = 0;i < chatroomsArray.length;i++){
        if(chatroomsArray[i].socketId == socketID){
            return chatroomsArray[i];
        }
    }
}

var getRoomsBySocketExists = function(socketID) {
    for(i = 0;i < chatroomsArray.length;i++){
        if(chatroomsArray[i].socketId == socketID){
            return true;
        }
    }
}

var getPlayerById = function(playerID) {
    for(i = 0;i < playersArray.length;i++){
        if(playersArray[i].playerId == playerID){
          return i;
      }
  }
}

var getSocketArray = function(socketID) {
    for(i = 0;i < getSocketArray.length;i++){
        if(getSocketArray[i] == socketID){
          return i;
      }
  }
}

var getTeamByRole = function(roleName) { // roles

    if (roleName == 'civilian') { // this is really dodgy, i couldnt get my for loop getting the 0 without breaking
        return rolesArray[0].roleTeam;
    } else {
        for(l = rolesArray.length -1; l> 0; --l){
            if(rolesArray[l].roleName == roleName){
              return rolesArray[l].roleTeam;
          }
    }
    }

}

var isSus = function(roleName) { // roles

    if (roleName == 'civilian') { // this is really dodgy, i couldnt get my for loop getting the 0 without breaking
        return rolesArray[0].roleSus;
    } else {
        for(l = rolesArray.length -1; l> 0; --l){
            if(rolesArray[l].roleName == roleName){
              return rolesArray[l].roleSus;
          }
    }
    }

}

var isSpectator = function(socketID) {
    if (playersArray[getPlayerBySocket(socketID)] == null) {
        return true;
    } else {
        return false;
    }
}
/*
var isHost = function(hostId) {
    for(i = 0;i < playersArray.length;i++){
        if(playersArray[i].socketId == hostId){
          return true;
      }
  }
}
*/
var roleExists = function(role) {
    for(i = 0;i < playersArray.length;i++){
        if(playersArray[i].playerRole == role){
          return true;
      }
  }
}

    //function
var availableRolesInit = function(input, name) {
    roleArrayIndex = getRoleNumByName(name);
    for (i = 0; i < input; i++) {
        availableRoles.push(rolesArray[roleArrayIndex].roleName) 
    }
}

var getRndInteger = function(min, max) { // GENERATES RND VAL BETWEEN MIN + MAX
    return Math.floor(Math.random() * (max - min)) + min;
}


// Player lists

function playerListUpdate() {
    var playerList = '';
    for (i = 0; i < playersArray.length; i++) {
        var name = playersArray[i].playerName;
        var vote = playersArray[i].playerVotes;

        if (vote === undefined || vote === null) {
            playerList += `<li class='player-listItem'> ${name} </li>`;
        } else
        playerList += `<li> ${name} - <span class='votes'>${vote}</span> </li>`;
    }
    return playerList;
}

var getPlayerVote = function() { // called by the generated buttons
    //testing only
    vote = event.srcElement.id;
    document.getElementById("voteSelect").innerHTML = vote;
}


// fischer shuffle (true random shuffle)
const shuffleArray = array => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = array[i];
          array[i] = array[j];
          array[j] = temp;
    }
}


function getMode(ary) {
    var counter = {};
    var mode = [];
    var max = 0;
    for (var i in ary) {
        if (!(ary[i] in counter))
            counter[ary[i]] = 0;
        counter[ary[i]]++;

        if (counter[ary[i]] == max) 
            mode.push(ary[i]);
        else if (counter[ary[i]] > max) {
            max = counter[ary[i]];
            mode = [ary[i]];
        }
    }
    return mode; 
}




var fillCivilians = function() {
    availableRolesInit(playersArray.length - availableRoles.length, 'civilian')
}


var initRoleAssign = function() {
    shuffleArray(availableRoles); // true random shuffle of array before assigning role
    for (i = 0; i < playersArray.length; i++) {
        var sel = availableRoles[getRndInteger(0,availableRoles.length)]; //get random value
        //console.log(sel);
        playersArray[i].playerRole = sel //change player role to this random value

        var team = getTeamByRole(sel);

        if (sel == 'mafia' || sel == 'doctor') {
            roomRole = sel;
        } else {
            roomRole = '';
        }

        if (team == 'infected') {
            roomPlus = team;
        } else {
            roomPlus = '';
        }

        if (sel == 'detective') {
            actionUtil = 'detective';
        }

        // create room here

        var y = new Room(playersArray[i].socketId, 'general', roomRole, roomPlus); // initiate rooms available
        chatroomsArray.push(y);

        //console.log(chatroomsArray[i]);


        // ONLY FOR TESTING PURPOSES, THIS WILL BE EXPLOITED IF LEFT IN v
        console.log(playersArray[i].playerRole + ' - ' + getTeamByRole(playersArray[i].playerRole));
        splicifier(sel); //remove role from pool
    }
}

var chatroomsGet = function(socketID) { // output rooms object as an array
    r = getRoomsBySocket(socketID);
    rooms = [r.roomMain, r.roomRole, r.roomPlus]
    return rooms;
}




/*
var chatroomsGet = function(socketID) { // output rooms object as an array
    r = getRoomsBySocket(socketID);
    if (getRoomsBySocketExists(socketID) == true) {
        rooms = [r.roomMain, r.roomRole, r.roomPlus]
        return rooms;
    } else {
        return;
    }
}
*/

// ahhhhhhhhhhhhh console.log(getTeamByRole('civilian'));

/*
var initTeamAssign = function() {
    for (l = playersArray.length -1; l>= 0; --l){
        var team = getTeamByRole(playersArray[l].playerRole);
        console.log(team);

        //playersArray[l].playerTeam = team;



        //playersArray[i].playerTeam = getRoleByName(playersArray[i].playerRole);

        //console.log('Team - ' + team);
        //console.log('ID:'+playersArray[i].playerId +", "+playersArray[i].playerName+", Role: "+playersArray[i].playerRole);
        //console.log(playersArray[i].playerId + playersArray[i].playerTeam);
    }
    //console.log(playersArray);
}*/

var splicifier = function(e) { // for roles init
    for (l = availableRoles.length; l>= 0; --l) {
        if (availableRoles[l] == e) {
            availableRoles.splice(l, 1);
            return;
        }
    }
}

// Win conditions

var numberOf = function(role) {
    var total = 0;
    for(i = 0;i < playersArray.length;i++){
        if(playersArray[i].playerRole == role){
          total++;
      }
    } return total;
}

var civilWin = function() {
    if (numberOf('mafia') < 1) {
        return true;
    } else {
        return false;
    }
}

var mafiaWin = function() {
    if (numberOf('mafia') >= numberOf('civilian')) {
        return true;
    } else {
        return false;
    }
}

var winConditions = function() {
    if (civilWin == true || mafiaWin == true) {
        return true;
    } else {
        return false;
    }
}






// exports the variables and functions above so that other modules can use them

module.exports = {
    // Classes
    Lobby: Lobby, 
    Night: Night, 
    Day: Day, 
    Vote: Vote,

    // Arrays
    playersArray: playersArray,
    rolesArray: rolesArray,
    phaseArray: phaseArray,
    availableRoles: availableRoles,
    suspectsRevealed: suspectsRevealed,
    playersKilled: playersKilled,

    userCreate: userCreate,
    getPlayerBySocket: getPlayerBySocket,
    getPlayerById: getPlayerById,
    getSocketArray: getSocketArray,
    isSus: isSus,
    isSpectator: isSpectator,
    //isHost: isHost,
    roleExists: roleExists,
    getMode: getMode,
    fillCivilians: fillCivilians,
    availableRolesInit: availableRolesInit,
    playerListUpdate: playerListUpdate,
    initRoleAssign: initRoleAssign,
    chatroomsGet: chatroomsGet,
    getRoomsBySocketExists: getRoomsBySocketExists,
    //initTeamAssign, initTeamAssign,

    winConditions: winConditions,
    civilWin: civilWin,
    mafiaWin: mafiaWin
}