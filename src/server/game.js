const Constants = require('../shared/constants');
const Player = require('./player');
const CapturePoint = require('./capturepoint');
const HealPoint = require('./healpoint');
const collisions = require('./collisions');
const { kebabCase } = require('lodash');


class Game{
    constructor(){
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.capturepoints = [];
        this.healpoints = [];
        this.activeCapturePoints = [];
        this.activeHealPoints = [];
        this.top10 = [];
        this.serverProfitSinceCap = 0;
        this.timeSinceLastCap = 0;
        this.lastActiveCP = 0;
        this.timeTillHP = 0;
        this.globalServerMessage = '';
        this.fiveminmessage = true;
        this.oneminmessage = true;
        this.messageTime = Constants.GLOBAL_MESSAGE_LENGTH;
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        this.createAilPoints();
        setInterval(this.update.bind(this), 1000 / 60);//1000ms in second, /60 for 60 updates/second
    }
    //create ail points at the start
    createAilPoints(){
      //Create Capture Points
      for (let i = 0; i < Constants.CAPTURE_POINT_QUANTITY; i++){
        this.capturepoints.push(new CapturePoint(Constants.CP_CAPTURE_RADIUS));
      }
      //initialize first capturepoint
      //this.activeCapturePoints.push(this.capturepoints[0]);//uncomment line for capturepoint testing
      //this.lastActiveCP = 0;
      this.lastActiveCP = -1;
      //console.log("First Capture Point Location: ", this.capturepoints[0].x, this.capturepoints[0].y);
      //Create Heal Points
      for (let i = 0; i < Constants.HEAL_POINT_QUANTITY; i++){
        this.healpoints.push(new HealPoint(Constants.HEAL_POINT_RADIUS));
      }
    }

    addPlayer(socket, username){
        this.sockets[socket.id] = socket;

        //generate position to start the player at
        //Random within middle 1/4 of map
        //random coordinate within range of 0-1/2 map size + 1/4 map size that does not collide with any given colliders
        //ex map size 6400, xy = 0-3200 + 1600 = 1600-4800
        let foundSpawn = false;
        let x, y;
        while (!foundSpawn){//generate a new spawn until it does not collide with any colliders on the map
          x = Math.random() * (Constants.MAP_SIZE / 2) + (Constants.MAP_SIZE / 4);
          y = Math.random() * (Constants.MAP_SIZE / 2) + (Constants.MAP_SIZE / 4);
          if (!collisions.objectBFACollision(x, y, Constants.PLAYER_RADIUS)){
            foundSpawn = true;
          }
        }
        this.players[socket.id] = new Player(socket.id, username, x, y);
        this.createUpdate(this.players[socket.id]);
    }

    removePlayer(socket){
        delete this.sockets[socket.id];//perhaps dont do this and dont create a new one for them when they click start since they already have one
        delete this.players[socket.id];
    }
    //minimize things taking data from client to server, mousedir now only needs to be sent through the mouseDir changer, which may
    //be best combined into handleInput to make it easier to read (refactor notes)
    handleInput(socket, dir){
        if (this.players[socket.id]){
            this.players[socket.id].setDirection(dir);
        }
    }
    shoot(socket, mouseDir){
      if (this.players[socket.id]){
        this.players[socket.id].shoot(mouseDir);
      }
    }
    dash(socket, mouseDir){
      if (this.players[socket.id]){
        this.players[socket.id].dash(mouseDir, collisions.checkDashCollisions(this.players[socket.id], mouseDir));
      }
    }
    recall(socket){
      if (this.players[socket.id]){
        //lock player movement, lock player shooting, start 6 second timer... player can still die during this time
        this.players[socket.id].startRecallTimer();
      }
    }
    handleSpeed(socket, speed){
      if (this.players[socket.id]){
        this.players[socket.id].setSpeed(speed);
      }
    }
    updatePlayerMouseDir(socket, dir){
      if (this.players[socket.id]){
        this.players[socket.id].setMouse(dir);
      }
    }

    update(){
        //calculate time elapsed
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        this.timeSinceLastCap += dt;

        if (this.serverProfitSinceCap >= Constants.CAPTURE_POINT_REQUIRED_GOLD && this.fiveminmessage){
          //countdown starts
          this.globalServerMessage = "Capture Point Spawning in 5 Minutes";
          this.fiveminmessage = false;
        }
        this.timeTillHP -= dt;
        if (Constants.CAPTURE_POINT_REQUIRED_TIME - this.timeSinceLastCap <= 60 && this.serverProfitSinceCap >= Constants.CAPTURE_POINT_REQUIRED_GOLD && this.messageTime == Constants.GLOBAL_MESSAGE_LENGTH && this.oneminmessage){
          this.globalServerMessage = "Capture Point Spawning in 1 Minute";
          this.oneminmessage = false;
        }
        //set active capture and heal points
        //console.log(this.timeSinceLastCap - Constants.CAPTURE_POINT_REQUIRED_TIME, this.serverProfitSinceCap, this.activeCapturePoints.length);
        if (this.timeSinceLastCap >= Constants.CAPTURE_POINT_REQUIRED_TIME && this.serverProfitSinceCap >= Constants.CAPTURE_POINT_REQUIRED_GOLD && this.activeCapturePoints.length <= 0){
          if (this.lastActiveCP < this.capturepoints.length){
            this.lastActiveCP++;
          }else{
            this.lastActiveCP = 0;
          }
          this.activeCapturePoints.push(this.capturepoints[this.lastActiveCP]);
          this.globalServerMessage = `Objective Spawned, capture for ${Constants.CAPTURE_POINT_BONUS_GOLD} Gold!`;
          this.messageTime = Constants.GLOBAL_MESSAGE_LENGTH;
        }

        if (this.activeHealPoints.length < Constants.MAX_HEAL_POINTS && this.timeTillHP <= 0){
          this.timeTillHP = Constants.HEAL_POINT_RESPAWN_TIME;
          this.activeHealPoints.push(this.healpoints[0]);
          this.healpoints.splice(0, 1);
        }

        //check the status of active healpoints/capturepoints
        for (let i = 0; i < this.activeCapturePoints.length; i++){
          //console.log(this.activeCapturePoints[i].timeLeft);
          const activePoint = this.activeCapturePoints[i];
          activePoint.collision(Object.values(this.players));
          activePoint.update(dt);
          //console.log(activePoint);
          if (activePoint.timeLeft <= 0){
            activePoint.currentPlayer.score += Constants.CAPTURE_POINT_BONUS_GOLD;
            this.globalServerMessage = "Objective Has Been Taken";
            this.activeCapturePoints.splice(i, 1);
            this.serverProfitSinceCap = 0;
            this.timeSinceLastCap = 0;
            this.fiveminmessage = true;
            this.oneminmessage = true;
          }
        }
        for (let i = 0; i < this.activeHealPoints.length; i++){
          const activePoint = this.activeHealPoints[i];
          activePoint.collision(Object.values(this.players));
          activePoint.update(dt);
          //console.log(activePoint);
          if (activePoint.timeLeft <= 0){
            if (activePoint.currentPlayer.hp < Constants.PLAYER_MAX_HP){
              activePoint.currentPlayer.hp += Constants.HEAL_POINT_AMOUNT;
            }
            this.healpoints.push(this.activeHealPoints[i]);
            this.activeHealPoints.splice(i, 1);
          }
        }
        //global server message
        if (this.globalServerMessage != ''){
          this.messageTime -= dt;
          if (this.messageTime <= 0){
            this.globalServerMessage = '';
            this.messageTime = Constants.GLOBAL_MESSAGE_LENGTH;
          }
        }

        //update each bullet
        const bulletsToRemove = [];
        this.bullets.forEach(bullet => {
            if (bullet.update(dt)){
                //destroy
                bulletsToRemove.push(bullet);
            }
        });
        this.bullets = this.bullets.filter(bullet => !bulletsToRemove.includes(bullet));

        //update each player
        Object.keys(this.sockets).forEach(playerID => {
            const player = this.players[playerID];
            if (player.hp > 0){
              player.checkCollisions(collisions.checkPlayerCollisions(player));
            }
            const newBullet = player.update(dt);
            if (newBullet){
                this.bullets.push(newBullet);
            }
        });

        //Apply collisions for each player to game colliders
        // for (let i = 0; i < this.players.length; i++){
        //   player.checkCollisions(checkPlayerCollisions(player));
        // }
        
        //Apply collisions, give players score for bullets that hit
        let destroyedBullets = collisions.applyCollisions(Object.values(this.players), this.bullets);
        destroyedBullets.forEach(b => {
          if (this.players[b.parentID] && b.playerCollision == true) {
            this.players[b.parentID].halfDashCooldown();
            const hitID = b.hitID;
            if (hitID.hp <= 0){
              let gold = Constants.GOLD_ON_KILL;
              this.players[b.parentID].onKill(gold);
              let insurance = (hitID.score - 1000) / 2;
              if (insurance > 0){
                this.serverProfitSinceCap += hitID.score - 400 - insurance;
              }else{
                this.serverProfitSinceCap += hitID.score - 400;
              }
              hitID.onDeath();
            }

          }
        });
        this.bullets = this.bullets.filter(bullet => !destroyedBullets.includes(bullet));
    
        // Check if any players are dead and apply player collisions
        Object.keys(this.sockets).forEach(playerID => {
          const socket = this.sockets[playerID];
          const player = this.players[playerID];
          if (player.hp <= 0 && !player.playingDeathAnimation) {
            //console.log('killed player');
            socket.emit(Constants.MSG_TYPES.GAME_OVER);
            this.tryTop10(player);
            socket.emit('startMenu', this.top10);//update menu stats
            this.removePlayer(socket);
          }
          if (player.recallTimer <= 0){
            socket.emit(Constants.MSG_TYPES.RECALLED);
            this.tryTop10(player);
            socket.emit('startMenu', this.top10);//update menu stats
            this.removePlayer(socket);
          }
        });
        // Object.keys(this.players).forEach(playerID => {
        //   const player = this.players[playerID];
        //   player.checkCollisions(collisions.checkPlayerCollisions(player));
        // });
    
        // Send a game update to each player every other time
        if (this.shouldSendUpdate) {
          Object.keys(this.sockets).forEach(playerID => {
            const socket = this.sockets[playerID];
            const player = this.players[playerID];
            socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player));
          });
          this.shouldSendUpdate = false;
        } else {
          this.shouldSendUpdate = true;
        }
      }
      tryTop10(player){
        let found = false;
        let username = player.username;
        if (username == ''){
          username = 'anonymous';
        }
        if (this.top10.length < 10){
          this.top10.push([username, player.score]);
        }else{
          for (let i = 0; i < 10; i++){
            if (player.score > this.top10[i][1]){
              this.top10.push([username, player.score]);
              found = true;
              break;
            }
          }
          if (found){
            this.top10.sort(this.compareSecondColumn);
            this.top10.splice(10, 1);
          }
        }
        
        this.top10.sort(this.compareSecondColumn);
        //console.log(this.top10);
      }
      compareSecondColumn(a, b) {
        if (a[1] === b[1]) {
            return 0;
        }
        else {
            return (a[1] > b[1]) ? -1 : 1;
        }
    }
    
      createUpdate(player) {
        const nearbyPlayers = Object.values(this.players).filter(
          p => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 4,
        );
        const nearbyBullets = this.bullets.filter(
          b => b.distanceTo(player) <= Constants.MAP_SIZE / 4,
        );
        //console.log(nearbyPlayers.map(p => p.serializeForUpdate()));
        return {
          t: Date.now(),
          me: player.serializeForUpdate(),
          others: nearbyPlayers.map(p => p.serializeForUpdate()),
          bullets: nearbyBullets.map(b => b.serializeForUpdate()),
          capturepoints: this.activeCapturePoints,
          healpoints: this.activeHealPoints,
          message: this.globalServerMessage,
          leaderboard: this.top10,
        };
    }
}

module.exports = Game;