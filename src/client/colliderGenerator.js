import { size } from 'lodash';
import { generate } from 'shortid';
import { getCurrentState } from './state';
import { getBFA, setBFA } from './theBigColliderArray';
import { getBFAMapSize } from './theBigColliderArray';
const Constants = require('../shared/constants');



let debugBoxes = [];
let originalMapSize = getBFAMapSize();
let mouseDownX, mouseDownY, mouseX, mouseY;
let creating = false;
let doneCreating = false;
let BFA = getBFA();
if (Constants.COLLISION_EDITOR){
    generateDebugBoxes();
}
function generateDebugBoxes(){
    if (Constants.COLLISION_EDITOR){ //only edit colliders if you are supposed to
        debugBoxes = getBFA();
        //if array already exists at run, check to see if the map size has changed then scale the array accordingly if it has.
        if (debugBoxes != null){
            //console.log("debugBoxes set to existing collision array");
            //console.log("DebugBoxes: " + debugBoxes);
            if (Constants.MAP_SIZE != getBFAMapSize()){
                let sizeDiff =  Constants.MAP_SIZE / getBFAMapSize();
                //console.log(`the map size has been changed since editing these colliders. The edited map size was ${sizeDiff} times larger than now`);
                //console.log(`debugBoxes Size: ${debugBoxes.length}`);
                for (let i = 0; i < debugBoxes.length; i++){
                    debugBoxes[i][0] = debugBoxes[i][0] * sizeDiff;
                    debugBoxes[i][1] = debugBoxes[i][1] * sizeDiff;
                    for (let o = 2; o < 6; o++){
                        //if the map size has increased (you can see less on your screen since the map is bigger) the colliders need to scale accordingly.
                        //ex: 1600 editing becomes 6400 in-game--> player starting pos becomes 3200, 3200 instead of 800, 800
                        //the world positions need to multiply by 4 (me.x, me.y, debugboxes[-][4] and [5])
                        //the width and height needs to multiply by 4
                        //screenspace coordinates are wonky, you would think they remain the same though...
    
                        //the screenspace coordinates seem to scale by a much larger amount the further from the center they are
                        debugBoxes[i][o] = debugBoxes[i][o] * sizeDiff; // lol
                    }
                }
            }
        }
}

    if (Constants.COLLISION_EDITOR){
        window.addEventListener('mousedown', (e) => {
            mouseDownX = e.clientX;
            mouseDownY = e.clientY;
            creating = true;
        });
        window.addEventListener('mouseup', (e) => {
            doneCreating = true;
            createDebugRect(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            //console.log(`MouseCanvasPos: ${e.clientX - (window.innerWidth / 2)}, ${e.clientY - (window.innerHeight / 2)}`);
        });
        window.addEventListener('keydown', (e) => {
            if (e.key == 'l'){//collider debug
                let colls = generateColliders();
                console.log(colls);
                console.log(`Colliders as a string:\nMap Size: ${Constants.MAP_SIZE}\n${colls}`);
                console.log(debugBoxes);
            }
            if (e.key == 'p'){//player coords
                const {me} = getCurrentState();
                console.log(me.x, me.y);
            }
            if (e.key == 'o'){
                const { me } = getCurrentState();
                let tempBFA = getBFA();
                //delete collider mouse collides with
                let temp = objectBFACollision(mouseX - (window.innerWidth / 2) + me.x, mouseY - (window.innerHeight / 2) + me.y, 50);
                if (temp.length > 0){
                    for (let i = 0; i < tempBFA.length; i++){
                        for (let o = 0; o < temp.length; o++){
                            if (tempBFA[i] == temp[o]){
                                console.log('popped');
                                tempBFA.pop(tempBFA[i]);
                            }
                        }
                    }
                    setBFA(tempBFA);
                    generateDebugBoxes();
                }
    
            }
        });
    }
    function objectBFACollision(x, y, radius){
        let whichBox = [];
        for (let i = 0; i < BFA.length; i++){
            let centX = (BFA[i][4] + BFA[i][0] + (BFA[i][2] / 2));
            let centY = (BFA[i][5] + BFA[i][1] + (BFA[i][3] / 2));
            let circleDistanceX = Math.abs(x - centX);
            let circleDistanceY = Math.abs(y - centY);
            let width = BFA[i][2];
            let height = BFA[i][3];
            if (circleDistanceX < radius && circleDistanceY < radius){
                console.log('centx, y', centX, centY, 'mouse x, y', x, y);
                whichBox.push(BFA[i]);
            }
            //if (Math.hypot(centX - x, centY - y) > Constants.COLLISION_DIST){continue}; //no collision
            // if (circleDistanceX > (width + radius)) {continue}; //no collision
            // if (circleDistanceY > (height + radius)) {continue}; //no collision
            // if (circleDistanceX <= (width/2)) {whichBox.push(BFA[i]); console.log('collision'); break}; //collision
            // if (circleDistanceY <= (height/2)) {whichBox.push(BFA[i]); console.log('collision'); break}; //collision
        }
        if (whichBox.length > 0){
            console.log('collision');
            return whichBox;
        }
        return [];
    }
    function createDebugRect(finalX, finalY){
        const { me } = getCurrentState();
        let temp = []; //temporary array to hold a debugBox
        if (finalX - mouseDownX < 5){
            return;
        }
        temp[0] = mouseDownX - (window.innerWidth / 2); //x-starting
        temp[1] = mouseDownY - (window.innerHeight / 2); //y-starting
        temp[2] = finalX - mouseDownX; //width
        temp[3] = finalY - mouseDownY; //height
        temp[4] = me.x; //x and y coords of player are so that the collider boxes can move with the player/not stay stagnant to the camera
        temp[5] = me.y;
        debugBoxes.push(temp);
    }
    //returns the points of the actual colliders (all four corners of each collision box)
    //uses debugBoxes to get the points, when editing colliders you should be able to see all of these
    function generateColliders(){
        let colliders = [];
        for (let i = 0; i < debugBoxes.length; i++){
            let coordSet = [];//each temp contains 2 coordinates, and 4 elements.. 
                          //temp[0] = top left x, temp[1] = top left y, temp[2] = bottom right x, temp[3] = bottom right y
            for (let o = 0; o < 4; o++){
                //For the X coordinates
                if (debugBoxes[i][2] < 0){//if drawn backwards
                    //top left x = playerx + (mouseDownX - windowWidth + width)--width is negative in this case so its actually subtracting it
                    coordSet[0] = debugBoxes[i][4] + (debugBoxes[i][0] + debugBoxes[i][2]);
                    coordSet[2] = debugBoxes[i][4] + (debugBoxes[i][0]);
                }else{
                    coordSet[0] = debugBoxes[i][4] + (debugBoxes[i][0]);
                    coordSet[2] = debugBoxes[i][4] + (debugBoxes[i][0] + debugBoxes[i][2]);
                }
                //For the Y coordinates
                if (debugBoxes[i][3] < 0){//if drawn up
                    //top left y = playerY + (mousedownY - windowHeight + height)--height is negative in this case so its actually subtracting it
                    coordSet[1] = debugBoxes[i][5] + (debugBoxes[i][1] + debugBoxes[i][3])
                    coordSet[3] = debugBoxes[i][5] + (debugBoxes[i][1]);
                }
                else{
                    coordSet[1] = debugBoxes[i][5] + (debugBoxes[i][1])
                    coordSet[3] = debugBoxes[i][5] + (debugBoxes[i][1] + debugBoxes[i][3]);
                }  
            }
            colliders.push(coordSet); //add a set of coordinates to the array of coordinate sets
        }
        return (colliders); //return the array containing all the arrays of coordinates
    }
}

export function getDebugBoxes(){
    if (Constants.COLLISION_EDITOR){
        return debugBoxes;
    }
    else{
        return null;
    }
}