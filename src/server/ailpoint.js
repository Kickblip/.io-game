//ailpoint.js is the parent object for capturepoints, healpoints, and spawn points to inherit
//this script contains the spawn logic for capture points, heal points, and spawn points
const Constants = require("../shared/constants");
const collisions = require('./collisions');

class Ailpoint{
    constructor(radius){
        this.radius = radius;
        this.x;
        this.y;
        this.active = false;
        this.currentPlayer = null;
        this.timeLeft;
        this.timeAmount;//because im a terrible programmer this gets set in the child
        this.generateRandomPoint();//immediately create it at a random point
    }
    generateRandomPoint(){
        let found = false;
        while (!found){
            let max = Constants.MAP_SIZE;
            let x = Math.random() * max;
            let y = Math.random() * max;
            found = !collisions.objectBFACollision(x, y, this.radius);//true if collision, false if no collision
            if (found){
                //console.log("Found Coordinates: ", x, y);
                this.x = x;
                this.y = y;
            }
        }
    }
    collision(players){
        let playersInside = 0;
        for (let i = 0; i < players.length; i++){
            //console.log("player xy object xy\n", players[i].x, players[i].y, "\n", this.x, this.y);
            if (collisions.circleCircle(this.x, this.y, players[i].x, players[i].y, this.radius, Constants.PLAYER_RADIUS)){
                if (players[i].hp > 0){
                    playersInside++;
                    this.currentPlayer = players[i];
                }
            }
        }
        if (playersInside == 1){
            this.active = true;
        }else{
            this.active = false;
            this.timeLeft = this.timeAmount;
        }
    }
    serializeForUpdate(){
        return{
            x: this.x,
            y: this.y,
            radius: this.radius,
            currentPlayer: this.currentPlayer,
        };
    }


    //Getters
    getX(){
        return this.x;
    }
    getY(){
        return this.y;
    }
    getRadius(){
        return this.radius;
    }
    getActive(){
        return this.active;
    }
    getTimeLeft(){
        return this.timeLeft;
    }
}

module.exports = Ailpoint;
