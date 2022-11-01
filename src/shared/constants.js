//these are global variables, changing them will change how the game operates. Great for tweaking gameplay settings in testing
module.exports = Object.freeze({
    COLLISION_EDITOR: false, //change to true to write map colliders (will return an array of collidor coordinates when done)
    //Default Map Size => 6400
    MAP_SIZE: 6400, //highly reccommended to also change the map size in order to make drawing colliders much easier

    COLLISION_DIST: 500,//~500 seems about right, future systems may chunk collision data
    //Player
    PLAYER_RADIUS: 32,//32
    PLAYER_MAX_HP: 3,
    PLAYER_SPEED: 325,
    PLAYER_FIRE_COOLDOWN: 1,//4 second cooldown between fireballs unless you hit a player in which you can instantly shoot again
    ANIMATION_FRAMERATE: 8,//16fps

    //Dashing
    PLAYER_DASH_COOLDOWN: 4,
    PLAYER_DASH_DISTANCE: 400,
    //fireball
    BULLET_RADIUS: 10,
    BULLET_SPEED: 1000, //must be different than player speed, even if just by 1... if this becomes a problem for some reason it can be solved but it makes 0 sense to have bullets travel the same speed as the player
    BULLET_DAMAGE: 1,
    IDLE_DIST_FROM_PLAYER: 48,
    //capture point
    CAPTURE_TIME: 10,//in seconds
    MAX_ACTIVE: 1,
    CAPTURE_POINT_QUANTITY: 50, //locations for them to spawn
    CP_CAPTURE_RADIUS: 75,
    CAPTURE_POINT_BONUS_GOLD: 1000,
    //capture point requirements
    CAPTURE_POINT_REQUIRED_GOLD: 1000, //gold required to have been profited by server (default 2000, lowered in testing to make more fun
    CAPTURE_POINT_REQUIRED_TIME: 300, //in seconds till next spawn criteria (5 mins)
    //heal point
    HEAL_POINT_TIME: 3,//in seconds
    HEAL_POINT_RADIUS: 20,
    HEAL_POINT_QUANTITY: 100, //locations for them to spawn
    MAX_HEAL_POINTS: 15, //active number of heal points
    HEAL_POINT_RESPAWN_TIME: 15, //in seconds, every 30 seconds a heal point should spawn at a random location if there are less than 15 active
    HEAL_POINT_AMOUNT: 1, //how much hp the player should gain
    //spawn point
    //SPAWN_POINTS_QUANTITY: 50, not needed, a spawn point will be created for each player when they join

    //Recall
    RECALL_TIME: 6,//in seconds
    
    //GOLD
    PLAYER_STARTING_GOLD: 500, //how much gold a player should be spawned in with
    GOLD_ON_KILL: 400,
    INSURANCE_THRESHHOLD: 1000,
    INSURANCE_PERCENT: .5,

    //other
    GLOBAL_MESSAGE_LENGTH: 10,

    SCORE_BULLET_HIT: 20,//being changed to elimination only
    SCORE_PER_SECOND: 0,//useless old feature
    MSG_TYPES:{
        JOIN_GAME: 'join_game',
        GAME_UPDATE: 'update',
        INPUT: 'input',
        SHOOT: 'shoot',
        DASH: 'dash',
        RECALL: 'recall',
        RECALLED: 'recalled',//occurs on successful recall
        MOUSE: 'updatePlayerMouseDir',
        GAME_OVER: 'dead',
    },
});