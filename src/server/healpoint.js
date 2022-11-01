const AilPoint = require('./ailpoint');
const Constants = require('../shared/constants');

class HealPoint extends AilPoint{
    constructor(radius){
        super(radius);
        super.timeLeft = Constants.HEAL_POINT_TIME;
        super.timeAmount = Constants.HEAL_POINT_TIME;
        this.frame = 1;//8x4, 32 total frames, loop 17-24 while not being captured
        this.animationCooldown = 1/Constants.ANIMATION_FRAMERATE;
        this.countDown = false;
    }
    update(dt){
        this.animationCooldown -= dt;
        if (this.active && this.currentPlayer.hp < 3){
            this.timeLeft -= dt;
        }
        if (this.animationCooldown <= 0){
            if (this.frame < 17){
                this.frame++;
            }else if (this.frame < 24 && !this.countDown){
                this.frame++;
                if (this.frame == 24 && this.timeLeft > 2){
                    this.countDown = true;
                }
            }else if (this.countDown){
                this.frame--;
                if (this.frame == 17){
                    this.countDown = false;
                }
            }else{
                this.frame++;
                if (this.frame > 32){
                    this.frame = 1;
                }
            }
            this.animationCooldown = 1/Constants.ANIMATION_FRAMERATE;
        }
    }
    serializeForUpdate(){
        //console.log(this.id, this.direction, this.hp, this.fire);
        return{
            ...(super.serializeForUpdate()),
            timeLeft: this.timeLeft,
            active: this.active,
            frame: this.frame,
        };
    }
}
module.exports = HealPoint;