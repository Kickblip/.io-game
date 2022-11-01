const AilPoint = require('./ailpoint');
const Constants = require('../shared/constants');

class CapturePoint extends AilPoint{
    constructor(radius){
        super(radius);
        super.timeLeft = Constants.CAPTURE_TIME;
        super.timeAmount = Constants.CAPTURE_TIME;
        this.frame = 1;//52 frames in the cycle, 30 frames in the captured
        //7 rows by 8 for cycle, 4 rows by 8 for captured *last rows are not full
        //captured total frames is just under 4 seconds
        //cycle is just over 6 seconds
        this.onCycle = true;//false if it should switch to the captured anim
        this.animationCooldown = 1/Constants.ANIMATION_FRAMERATE;
    }
    update(dt){
        this.animationCooldown -= dt; 
        if (this.active){
            this.timeLeft -= dt;
            if (this.timeLeft <= 4 && this.onCycle){//checks for time and frame to make it as smooth as possible... Some overlap/variation on capturing is the result of smoothness.
                this.onCycle = false;//switch to the wrap up animation
                this.frame = 1;
            }
        }else{
            this.onCycle = true;
        }
        if (this.animationCooldown <= 0){//update frame
            if (this.onCycle){//loop through 52 frames and reset to frame 0 at the end
                if (this.frame < 52) {this.frame++;}
                else{this.frame = 1;}
            }else{//loop through 30 frames, do not reset after as the capture point should dissapear at that point.
                if (this.frame < 30){this.frame++;}
            }
            this.animationCooldown = 1/Constants.ANIMATION_FRAMERATE;//reset cooldown
        }
    }
    serializeForUpdate(){
        //console.log(this.id, this.direction, this.hp, this.fire);
        return{
            ...(super.serializeForUpdate()),
            timeLeft: this.timeLeft,
            active: this.active,
            frame: this.frame,
            onCycle: this.onCycle,
        };
    }
}
module.exports = CapturePoint;