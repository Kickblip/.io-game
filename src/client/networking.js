// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#4-client-networking
import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';
import { processGameUpdate } from './state';
import { setTop10 } from './render';
import { setCurrentUsers } from './render';

const Constants = require('../shared/constants');

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });
const connectedPromise = new Promise(resolve => {
  socket.on('connect', () => {
    //document.getElementById('play-menu').classList.remove('hidden'); workaround bug solve line, temp
    console.log('Connected to server!');
    resolve();
  });
});

export const connect = onGameOver => (
  connectedPromise.then(() => {
    // Register callbacks
    socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
    socket.on(Constants.MSG_TYPES.GAME_OVER, onGameOver);
    socket.on(Constants.MSG_TYPES.RECALLED, onGameOver);
    socket.on('disconnect', () => {
      console.log('Disconnected from server.');
      document.getElementById('disconnect-modal').classList.remove('hidden');
      document.getElementById('reconnect-button').onclick = () => {
        window.location.reload();
      };
    });
  })
);
socket.on('startMenu', setTop10);
socket.on('currentPlayers', setCurrentUsers);
export const play = username => {
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export const updateDirection = throttle(20, (dir, speed) => {
  socket.emit(Constants.MSG_TYPES.INPUT, dir, speed);
});

export const tryShoot = throttle(20, (mouseDir) => {
  socket.emit(Constants.MSG_TYPES.SHOOT, mouseDir);
});
export const tryDash = throttle(20, (mouseDir) => {
  socket.emit(Constants.MSG_TYPES.DASH, mouseDir);
});
export const recall = throttle(20, () => {
  socket.emit(Constants.MSG_TYPES.RECALL);
});
export const sendServerMouseDir = throttle(20, (mouseDir) => {
  socket.emit(Constants.MSG_TYPES.MOUSE, mouseDir);
});