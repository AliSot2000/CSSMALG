var map;
var grid;

window.addEventListener('load', function() {
    map = new Map();
    let road = map.createRoad(50, 50, angle(225), 500, 500, angle(45));
});

function angle(degrees) {
    return degrees * (Math.PI / 180);
}