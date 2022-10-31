var map;
var grid;

window.addEventListener('load', function() {
    map = new Map();
    let road = map.createRoad(50, 500, angle(270), 50, 50, angle(270));
    let road2 = map.createRoad(300, 50, angle(270), 750, 500, angle(0));
    let road3 = map.createRoad(700, 50, angle(225), 1400, 500, angle(45));

    road.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
    road2.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
    road3.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);
});

function angle(degrees) {
    return degrees * (Math.PI / 180);
}
