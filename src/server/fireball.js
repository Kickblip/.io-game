const shortid = require('shortid');
const ObjectClass = require('./object');
const Constants = require('../shared/constants');

class Fireball extends ObjectClass{
    constructor(parentID, x, y, dir){
        super(shortid(), x, y, dir, Constants.BULLET_SPEED);//shortid generates a network id for the object
        this.parentID = parentID;//tracks who created the bullet
        this.hitID = null;//the id of the player it collided with (if it was a player, otherwise this is null)
        this.playerCollision = false;//set to true under another script to allow the server to check if the bullet has hit a player and respond accordingly (half dash cooldown etc)
        this.animationFrame = 0; //6 frames
        this.frames = 5; //0-5 = 6 frames
        this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE
        this.dir = dir;
    }

    update(dt){
        super.update(dt);
        //---ANIMATION LOGIC---
        this.animationCooldown -= dt;
        if (this.animationCooldown <= 0){
            if (this.animationFrame < this.frames){
                this.animationFrame++;
            }else{
                this.animationFrame = 0;
            }
            this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
        }

        //needs to return position and animation frame, direction is needed but I think should be taken from the player where it already exists
        return this.x < 0 || this.x > Constants.MAP_SIZE || this.y < 0 || this.y > Constants.MAP_SIZE;
    }
    serializeForUpdate(){
        return {
            ...(super.serializeForUpdate()),
            animFrame: this.animationFrame,
            dir: this.dir,
        };
    }
}
module.exports = Fireball;