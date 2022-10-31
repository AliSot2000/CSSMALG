var map;
var grid;

window.addEventListener('load', function() {
    map = new Map();
    // let road = map.createRoad(50, 500, degToRad(270), 50, 50, degToRad(270));
    let road2 = map.createRoad(50, 50, degToRad(225), 1000, 500, degToRad(45));
    // let road3 = map.createRoad(700, 50, degToRad(225), 1600, 500, degToRad(45));

    // road.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
    road2.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
    // road3.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
});