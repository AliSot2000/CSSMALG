var map;
var grid;

window.addEventListener('load', function() {
    map = new Map();
    let road = map.createRoad(50, 50, degToRad(225), 1000, 500, degToRad(0));
    road.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('car', 1).createLane('bike', 1);
});