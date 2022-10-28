var map;
var grid;

window.addEventListener('load', function() {
    map = new Map();
    let road = map.createRoad(50, 50, angle(270), 500, 500, angle(0));
    let road2 = map.createRoad(1050, 50, angle(90), 600, 500, angle(0));

    road.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
    road2.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);

});

function angle(degrees) {
    return degrees * (Math.PI / 180);
}