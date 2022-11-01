const ObjectClass = require('./object');
const Fireball = require('./fireball');
const Constants = require('../shared/constants');
//const collisions = require('./collisions');

class Player extends ObjectClass{
    constructor(id, username, x, y, mDir, fire){
        super(id, x, y, Math.random() * 2 * Math.PI, Constants.PLAYER_SPEED);
        this.username = username;
        this.hp = Constants.PLAYER_MAX_HP;
        this.fireCooldown = false;
        this.score = Constants.PLAYER_STARTING_GOLD;
        this.triedToShoot = false;
        this.triedToDash = false;
        this.dashX;
        this.dashY;
        this.animationFrame = 1; //1-8
        this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
        this.idle = false;
        this.recalling = false;
        this.recallTimer = Constants.RECALL_TIME;
        this.framesDone = 0;//because pain
        this.loopUp = true;//also pain
        this.playingDeathAnimation = false;
        this.dashCooldown = 0;
        this.dashRatio = this.dashCooldown / Constants.PLAYER_DASH_COOLDOWN;
        this.fire = 1;
        this.fireState = 0;//0 = recharging, 1=charged/idle
        this.canMove = [true, true, true, true]; // x right, x left, y up, y down
    }

    update(dt){
        super.update(dt);
        //console.log(this.playingDeathAnimation, this.hp, this.animationCooldown);
        //console.log(`player coords: ${this.x}, ${this.y}`);

        this.score += dt * Constants.SCORE_PER_SECOND;
        this.animationCooldown -= dt;

        if (this.fireCooldown == true){
            if (this.animationCooldown <= 0){//this does not neet to change animation cooldown because animation cooldown is already always being calculated
                if (this.fire < 9){
                    this.fire++;
                }
                if (this.fire > 8){
                    this.fireCooldown = false;
                    this.fireState = 1;
                    this.fire = 1;
                }
            }
        }
        if (this.fireState == 1){
            if (this.animationCooldown <= 0){
                if (this.fire < 6){
                    this.fire++;
                }else{
                    this.fire = 1;
                }
            }
        }

        if (!this.recalling && this.hp > 0){
            if (this.animationCooldown <= 0){
                if (this.animationFrame < 8){
                    this.animationFrame++;
                }else{
                    this.animationFrame = 1;
                }
                this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
            }
            if (this.speed == 0){
                this.idle = true;
            }else{
                this.idle = false;
            }
        }
        if (this.recalling && this.hp > 0){
            this.idle = false;
            const totalRecallFrames = Constants.ANIMATION_FRAMERATE * Constants.RECALL_TIME;
            const loopFrames = totalRecallFrames - 19;
            let framesLeft = totalRecallFrames - this.framesDone;
            //loop frames 6-10
            if (this.animationCooldown <= 0){
                if (this.animationFrame < 19){
                    if (framesLeft > 17){
                        if (this.animationFrame < 10 && this.loopUp){
                            this.animationFrame++;
                        }else{
                            this.loopUp = false;
                            if (this.animationFrame > 6){
                                this.animationFrame--;
                            }else{
                                this.loopUp = true;
                                this.animationFrame++;
                            }
                            
                        }
                    }else{
                        this.animationFrame++;
                    }
                }else{
                    this.animationFrame = 20;
                }
                this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
                this.framesDone++;
            }
        }
        if (this.hp <= 0 && this.playingDeathAnimation){
            //player death is 41 frames...
            this.idle = false;
            if (this.animationCooldown <= 0){
                if (this.animationFrame < 41){
                    this.animationFrame++;
                }else{
                    this.playingDeathAnimation = false;
                }
                this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
            }
        }


        
        //updates location and makes sure the player is within bounds of the map size
        //Run collision detection to see if the player can move in a given direction
        //console.log(`canMove: ${this.canMove}`);
        //canmove[0]->[3]:: x right, x left, y up, y down
        //this.x += dt * this.speed * Math.sin(this.direction); // > 0 or < 0
        //this.y -= dt * this.speed * Math.cos(this.direction); // > 0 or < 0
        //ideally the player should only try to move in a given direction if it can
        //this.canMove = collisions.checkPlayerCollisions(this);
        if (!this.recalling && !this.playingDeathAnimation) {//dont allow the player to move if the player is recalling or dead
            if (this.canMove[0] != 0 || this.canMove[1] != 0){
                if (this.canMove[0] != 0){//restrict right
                    if (Math.sin(this.direction) < 0){
                        this.x += dt * this.speed * Math.sin(this.direction);
                    }
                }else{//restrict left
                    if (Math.sin(this.direction) > 0){
                        this.x += dt * this.speed * Math.sin(this.direction);
                    }
                }
            }else{
                this.x += dt * this.speed * Math.sin(this.direction);
            }
            if (this.canMove[2] != 0 || this.canMove[3] != 0){
                if (this.canMove[2] != 0){//restrict up
                    if (Math.cos(this.direction) < 0){
                        this.y -= dt * this.speed * Math.cos(this.direction);
                    }
                }else{//restrict down
                    if (Math.cos(this.direction) > 0){
                        this.y -= dt * this.speed * Math.cos(this.direction);
                    }
                }
            }else{
                this.y -= dt * this.speed * Math.cos(this.direction);
            }
            
            //prevents player from moving below 0 or beyond MAP_SIZE
            this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
            this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));
        }; 

        
        if (this.recalling){
            this.recallTimer -= dt;
        }

        //I need to half the current dash cooldown if a player hits another with a fireball
        this.dashCooldown -= dt;
        //this.fire = this.fireCooldown / Constants.PLAYER_FIRE_COOLDOWN; this.fire being rebranded to frame 1-9 of fireball recharge
        this.dashRatio = this.dashCooldown / Constants.PLAYER_DASH_COOLDOWN;
        //console.log(`fire(player): ${this.fire}`);
        if (this.fireCooldown == false && this.triedToShoot){
            //need to establish bullets to have their own velocity plus the player velocity
            //need to start a countdown timer that communicates with render.js to display the shooting cooldown correctly
            //this is a test
            this.fireCooldown = true;
            this.fireState = 0;
            this.triedToShoot = false;
            this.fire = 1;//reset animation
            return new Fireball(this.id, this.x, this.y, this.mDir);
        }
        if (this.dashCooldown <= 0 && this.triedToDash){

            this.dashCooldown = Constants.PLAYER_DASH_COOLDOWN;
            this.triedToDash = false;
            this.x = this.dashX;
            this.y = this.dashY;
            this.fireCooldown = false; // let the player shoot again right after dashing
            //add some distance to the x and y coordinates of the parent component(super.x, super.y)
            //console.log(`player x: ${this.getX()} y: ${this.getY()}\nmouse x: ${this.mouseX} y: ${this.mouseY}`);
            //let d = Math.sqrt((this.getX() - this.))
            //console.log(`${this.username} Dashed.\nid: ${this.id}\ncoords: ${this.x}, ${this.y}`);
            // this.x += Constants.PLAYER_DASH_DISTANCE * Math.sin(this.mDir);
            // this.y -= Constants.PLAYER_DASH_DISTANCE * Math.cos(this.mDir);
            //console.log(`\n${this.id} post dash coords\n${this.x}, ${this.y}`);
            //dash?
        }
        this.triedToDash = false;
        this.triedToShoot = false;
        
        return null;
    }
    takeBulletDamage(){
        this.hp -= Constants.BULLET_DAMAGE;
    }
    shoot(mouseDir){
        //console.log('player-shoot');
        if (!this.recalling && !this.playingDeathAnimation){//no shoot if recalling
            this.mDir = mouseDir;
            this.triedToShoot = true;
        }
    }
    dash(mouseDir, coord){
        //console.log("In player", coord[0], coord[1]);
        if (!this.recalling && !this.playingDeathAnimation){//no dash if recalling
            this.mDir = mouseDir;
            this.dashX = coord[0];//x
            this.dashY = coord[1];//y
            this.triedToDash = true;
        }
    }
    halfDashCooldown(){
        this.dashCooldown = this.dashCooldown / 2;
    }
    checkCollisions(colls){
        //console.log("checking player collisions: " + this.id);
        this.canMove = colls;
    }
    onKill(gold){
        this.score += gold;
        this.hp = Constants.PLAYER_MAX_HP;
        this.dashCooldown = 0;
    }
    setSpeed(speed){
        this.speed = speed;
    }
    setMouse(dir){
        this.mouseDir = dir;
    }
    getScore(){
        return this.score;
    }
    onDeath(){
        this.animationFrame = 1;
        this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
        this.playingDeathAnimation = true;
        let insurance = (this.score - Constants.INSURANCE_THRESHHOLD) * Constants.INSURANCE_PERCENT;
        if (insurance > 0){
            this.score = insurance;
        }else{
            this.score = 0;
        }
    }
    startRecallTimer(){
        this.recalling = true;
        this.animationFrame = 1;
        this.animationCooldown = 1 / Constants.ANIMATION_FRAMERATE;
    }
    serializeForUpdate(){
        //console.log(this.id, this.direction, this.hp, this.fire);
        return{//ideally I should minimize these as some may be redundant and they are sent frequently
            ...(super.serializeForUpdate()),
            direction: this.direction,
            hp: this.hp,
            fire: this.fire,
            dash: this.dashRatio,
            score: this.score,
            frame: this.animationFrame,
            idle: this.idle,
            recalling: this.recalling,
            dying: this.playingDeathAnimation,
            fireState: this.fireState,
            mouseDir: this.mouseDir,
        };
    }
}
module.exports = Player;