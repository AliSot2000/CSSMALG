var map;
var grid;

window.addEventListener('load', function() {
    map = new Map();
    let road = map.createRoad(50, 50, angle(225), 500, 500, angle(45));

    road.createLane('bike', -1).createLane('car', -1).createLane('car', 1).createLane('bike', 1);

    setTimeout(function() {
        road.deleteLane(1);
    }, 1000);
});

function angle(degrees) {
    return degrees * (Math.PI / 180);
}