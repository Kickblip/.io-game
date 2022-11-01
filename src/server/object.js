const constants = require("../shared/constants");

class Object{
    constructor(id, x, y, dir, speed){
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = dir;
        this.speed = speed;
    }
    update(dt){

        //first I need to apply collisions which should tell the character if they are able to move in a particular direction
        //while this makes sense when the player and bullet function somewhat similarly, it makes more sense to offload this to the player if it is dealing with a player
        if (this.speed != constants.PLAYER_SPEED){ //do this for everything but the player... players and other objects can no longer share the same speed though...
            this.x += dt * this.speed * Math.sin(this.direction);
            this.y -= dt * this.speed * Math.cos(this.direction);
        }
    }
    distanceTo(object){
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    setDirection(dir){
        this.direction = dir;
    }
    serializeForUpdate(){
        return{
            id: this.id,
            x: this.x,
            y: this.y,
        };
    }
    getX(){
        return this.x;
    }
    getY(){
        return this.y;
    }
}
module.exports = Object;