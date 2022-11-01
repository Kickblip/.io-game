const { constant, truncate } = require('lodash');
const { ModuleFilenameHelpers } = require('webpack');
const Constants = require('../shared/constants');
const getBFA = require('./BFA');
//Player Collisions:
//By default, the game makes sure the player is within the map size bounds by simply not allowing the x or y values to surpass the map size
//We also need players to collide with walls, however
//pass through 4 coordinates for a wall, effectively creating a box (createBox())???
//every update, check the players coordinates and make sure they are not attempting to pass into this box, if they are, then prevent the players movement in the direction of the box from the player
//if the player is colliding with 2 sides of the box, restrict the players movement in both directions (or perhaps even 3 in some scenarios)
//these boxes also need to be passed through to render so that they can be drawn as a series of rectangles on the client


//All collision points need to be generated once and sent once.

let BFA = getBFA();
function applyCollisions(players, bullets){
    const destroyedBullets = [];
    for (let i = 0; i < bullets.length; i++){
        const bullet = bullets[i];
        for (let j = 0; j < players.length; j++){
            const player = players[j];
            if (bullet.parentID !== player.id && player.distanceTo(bullet) <= Constants.PLAYER_RADIUS + Constants.BULLET_RADIUS && player.hp > 0){

                //needs to pass a seperate value to show that the bullet collided with a player
                bullet.playerCollision = true;
                bullet.hitID = player;
                destroyedBullets.push(bullet); //true = player collision --half dash cooldown in game where the bullet is destroyed
                player.takeBulletDamage();
                break;
            }
        }
        //check for collisions with colliders in the map
        //perhaps a better way would be to do a line collision for this then let the bullet go until those coordinates unless it hits a player... More expensive calculation that only needs to be run once.
        for (let c = 0; c < BFA.length; c++){
            let centX = (BFA[c][0] + BFA[c][2]) / 2;
            let centY = (BFA[c][1] + BFA[c][3]) / 2;
            if (Math.hypot(centX - bullet.x, centY - bullet.y) > Constants.COLLISION_DIST / 2){continue};
            //unlike the player, direction of the collision is not relevant... This algorithm is a little more efficient
            //this is objectBFACollision but easier to leave as is for now
            circleDistanceX = Math.abs(bullet.x - centX);
            circleDistanceY = Math.abs(bullet.y - centY);
            width = BFA[c][2] - BFA[c][0];
            height = BFA[c][3] - BFA[c][1];
            if (circleDistanceX > (width/2 + Constants.BULLET_RADIUS)) {continue};
            if (circleDistanceY > (height/2 + Constants.BULLET_RADIUS)) {continue};
            if (circleDistanceX <= (width/2)) {destroyedBullets.push(bullet); break};
            if (circleDistanceY <= (height/2)) {destroyedBullets.push(bullet); break};
            cornerDistance_sq = (circleDistanceX - width/2)^2 + (circleDistanceY - height/2)^2;
            if (cornerDistance_sq <= (Constants.BULLET_RADIUS^2)){destroyedBullets.push(bullet)};
        }
        
    }
    return destroyedBullets;
}

//BFA is an array of all colliders containing 4 elements for each [0]-top left x, [1]-top left y, [2]-bottom right x, [3]-bottom right y
function checkPlayerCollisions(player){
    //console.log("Checking Collisions for Player id: " + player.id);h
    //console.log(BFA.length);
    let colls = [0, 0, 0, 0]; //x to the right, x to the left, y up, y down
    for (let i = 0; i < BFA.length; i++){
        //console.log('thing happen');
        let centX = (BFA[i][0] + BFA[i][2]) / 2;
        let centY = (BFA[i][1] + BFA[i][3]) / 2;
        if (Math.hypot(centX - player.x, centY - player.y) > Constants.COLLISION_DIST){continue};//only check nearby colliders
        //X
        if (Math.abs(player.x - BFA[i][2]) < Constants.PLAYER_RADIUS && player.y < BFA[i][3] + Constants.PLAYER_RADIUS && player.y > BFA[i][1] - Constants.PLAYER_RADIUS / 2) {colls[1] = BFA[i][2] + Constants.PLAYER_RADIUS};
        if (Math.abs(player.x - BFA[i][0]) < Constants.PLAYER_RADIUS && player.y < BFA[i][3] + Constants.PLAYER_RADIUS && player.y > BFA[i][1] - Constants.PLAYER_RADIUS / 2) {colls[0] = BFA[i][0] - Constants.PLAYER_RADIUS};
        //Y
        if (Math.abs(player.y - BFA[i][3]) < Constants.PLAYER_RADIUS && player.x < BFA[i][2] + Constants.PLAYER_RADIUS && player.x > BFA[i][0] - Constants.PLAYER_RADIUS / 2) {colls[2] = BFA[i][3] + Constants.PLAYER_RADIUS};
        if (Math.abs(player.y - BFA[i][1]) < Constants.PLAYER_RADIUS && player.x < BFA[i][2] + Constants.PLAYER_RADIUS && player.x > BFA[i][0] - Constants.PLAYER_RADIUS / 2) {colls[3] = BFA[i][1] - Constants.PLAYER_RADIUS};
    }
    return colls;
}

//dash collisions are only checked every time the player tries to dash, making it much less computationally heavy overall
function checkDashCollisions(player, dir){
    //ideas
    //just push the player to the edge of the collider on the side they came from
    //--problem, we dont know how frequent colliders are
    //line rect collision and find nearest point
    //--weakness, I still have to loop through all the colliders, so may as well just run player rect collision
    //halfway, check collision, halfway halfway, check collision, repeat to certain depth
    //--weakness, somewhat expensive, less precise when its less expensive, loops through all colliders multiple times

    //chosen: line rect collision:
    let x, y;
    //Before the player dashes, do a quick check to make sure they wont overlap with a collider in their final destination
    //Basic Dash Function
    x = player.x + Constants.PLAYER_DASH_DISTANCE * Math.sin(dir);
    y = player.y - Constants.PLAYER_DASH_DISTANCE * Math.cos(dir);


    let hits = [];
    let currentShortest = 99999999;//something way higher than will ever be returned
    let final = [];
    for (let i = 0; i < BFA.length; i++){
        let centX = (BFA[i][0] + BFA[i][2]) / 2;
        let centY = (BFA[i][1] + BFA[i][3]) / 2;
        let temp = lineRect(player.x, player.y, x, y, BFA[i][0], BFA[i][1], BFA[i][2] - BFA[i][0], BFA[i][3] - BFA[i][1]);
        if (temp != false){hits.push(temp)}
    }
    for (let i = 0; i < hits.length; i++){
        let temp = Math.hypot(hits[i][0] - player.x, hits[i][1] - player.y)
        if (temp < currentShortest){
            currentShortest = temp;
            final = hits[i];
        }
    }

    if (hits.length > 0){
        return final;
    }else{
        return [x, y];
    }
    //push back to a point where there is no collision
    /*
    let x, y;
    //Before the player dashes, do a quick check to make sure they wont overlap with a collider in their final destination
    //Basic Dash Function
    x = player.x + Constants.PLAYER_DASH_DISTANCE * Math.sin(dir);
    y = player.y - Constants.PLAYER_DASH_DISTANCE * Math.cos(dir);
    // this.x += Constants.PLAYER_DASH_DISTANCE * Math.sin(this.mDir);
    // this.y -= Constants.PLAYER_DASH_DISTANCE * Math.cos(this.mDir);
    whichBox = objectBFACollision(x, y); //if there is a collision whichBox is the collider there was a collision with
    let collision = whichBox.length > 0 ? true : false;
    if (!collision){
        // returns the new, changed player coordinates
        small = [x, y];
        return small;
    }else{

    }
    */
}
function objectBFACollision(x, y, radius){
    let whichBox = [];
    for (let i = 0; i < BFA.length; i++){
        let centX = (BFA[i][0] + BFA[i][2]) / 2;
        let centY = (BFA[i][1] + BFA[i][3]) / 2;
        circleDistanceX = Math.abs(x - centX);
        circleDistanceY = Math.abs(y - centY);
        width = BFA[i][2] - BFA[i][0];
        height = BFA[i][3] - BFA[i][1];
        if (Math.hypot(centX - x, centY - y) > Constants.COLLISION_DIST){continue}; //no collision
        if (circleDistanceX > (width/2 + radius)) {continue}; //no collision
        if (circleDistanceY > (height/2 + radius)) {continue}; //no collision
        if (circleDistanceX <= (width/2)) {whichBox = BFA[i]; break}; //collision
        if (circleDistanceY <= (height/2)) {whichBox = BFA[i]; break}; //collision
        cornerDistance_sq = (circleDistanceX - width/2)^2 + (circleDistanceY - height/2)^2;
        collision = (cornerDistance_sq <= (radius^2)); //maybe collision
    }
    if (whichBox.length > 0){
        return true;
    }
    return false;
}
function circleCircle(x1, y1, x2, y2, r1, r2){
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist =  Math.sqrt(dx * dx + dy * dy);
    if (dist < r1 + r2){
        return true;
    }
    return false;
}
// LINE/RECTANGLE
function lineRect(x1,y1,x2,y2,rx,ry,rw,rh) {

    // check if the line has hit any of the rectangle's sides
    // uses the Line/Line function below
    let xFind, yFind;
    if (x1 < rx + (rw / 2)){//right (player is to the left of the collision)
        xFind = lineLine(x1,y1,x2,y2, rx,ry,rx, ry+rh);
        xFind[0] -= Constants.PLAYER_RADIUS;
    }else{//left
        xFind = lineLine(x1,y1,x2,y2, rx+rw,ry, rx+rw,ry+rh);
        xFind[0] += Constants.PLAYER_RADIUS;
    }
    if (y1 < ry + (rh / 2)){//down
        yFind = lineLine(x1,y1,x2,y2, rx,ry, rx+rw,ry);
        yFind[1] -= Constants.PLAYER_RADIUS;
    }else{//up
        yFind = lineLine(x1,y1,x2,y2, rx,ry+rh, rx+rw,ry+rh);
        yFind[1] += Constants.PLAYER_RADIUS;
    }
   
    
  
    // if ANY of the above are true, the line
    // has hit the rectangle
    if (xFind || yFind){
        if (xFind && yFind){
            if (Math.hypot(xFind[0]- x1, xFind[1] - y1) > Math.hypot(yFind[0]- x1, yFind[1] - y1)){
                return xFind;
            }else{
                return yFind;
            }
        }else if (xFind){
            return xFind
        }else{
            return yFind;
        }

    }
    //console.log("no line collision");
    return false;
  }
  // LINE/LINE
  function lineLine(x1,y1,x2,y2,x3,y3,x4,y4) {
  
    // calculate the direction of the lines
    uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  
    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
  
      // optionally, draw a circle where the lines meet
      intersectionX = x1 + (uA * (x2-x1));
      intersectionY = y1 + (uA * (y2-y1));
      return [intersectionX, intersectionY];
    }
    return false;
  }

exports.circleCircle = circleCircle;
exports.objectBFACollision = objectBFACollision;
exports.checkDashCollisions = checkDashCollisions;
exports.applyCollisions = applyCollisions;
exports.checkPlayerCollisions = checkPlayerCollisions;
// module.exports = applyCollisions;
// module.exports = checkPlayerCollisions;