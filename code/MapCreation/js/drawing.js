var map;
var interface;

window.addEventListener('load', function() {
    map = new Map();
    interface = new Interface('div.interface', map);
    let road = map.createRoad(50, 50, degToRad(225), 300, 300, degToRad(90));
    let road2 = map.createRoad(600, 50, degToRad(225), 300, 300, degToRad(90));
    road.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
    road2.createLane('car', -1).createLane('car', 1);

    let intersection = map.createIntersection(500, 300);
    let intersection2 = map.createIntersection(300, 300);
});