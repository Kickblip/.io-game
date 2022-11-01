const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');

const Constants = require('../shared/constants');
const Game = require('./game');
const webpackConfig = require('../../webpack.dev.js');

let currentUsers = 0;
// Setup an Express server
const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
  // Setup Webpack for development
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  // Static serve the dist/ folder in production
  app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);

// Setup the Game
const game = new Game();

// Listen for socket.io connections
io.on('connection', socket => {
  console.log('Player connected!', socket.id);
  currentUsers++;
  console.log("Current Players:", currentUsers);
  console.log(game.top10);
  socket.emit('startMenu', game.top10);//update menu stats
  socket.emit('currentPlayers', currentUsers);//update menu stats
  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on(Constants.MSG_TYPES.SHOOT, shoot);
  socket.on(Constants.MSG_TYPES.DASH, dash);
  socket.on(Constants.MSG_TYPES.RECALL, recall);
  socket.on(Constants.MSG_TYPES.MOUSE, updatePlayerMouseDir);
  socket.on('disconnect', onDisconnect);
});



function joinGame(username) {
  game.addPlayer(this, username);
}
function updatePlayerMouseDir(mouseDir){
  game.updatePlayerMouseDir(this, mouseDir);
}
function handleInput(dir, speed) {
  game.handleInput(this, dir);
  game.handleSpeed(this, speed);
}
function shoot(mouseDir){
  game.shoot(this, mouseDir);
}
function dash(mouseDir){
  game.dash(this, mouseDir);
}
function recall(){
  game.recall(this);
}

function onDisconnect() {
  currentUsers--;
  console.log("Current Players:", currentUsers);
  game.removePlayer(this);
}
