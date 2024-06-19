import * as THREE from 'three';

let paused = false;
let pauseTime = null;

const clock = new THREE.Clock();

function pauseClock(){
    paused = true;
    pauseTime = clock.getElapsedTime();
    clock.stop();
}

function resumeClock(){
    paused = false;
    clock.start();
    clock.elapsedTime = pauseTime;
}


export {clock, pauseClock, resumeClock};