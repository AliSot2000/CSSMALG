/**
 * Creates an SVG element
 * @param {string} type The type of SVG element to create
 * @returns {Element} The SVG element
 */
function svgElement(type) {
    return document.createElementNS("http://www.w3.org/2000/svg", type);
}

/**
 * Checks if a variable is empty. This means the value is *null, undefined, length 0, undefined, NaN, 0 or false*
 * @function isEmpty
 * @param variable The variable to check
 * @returns {boolean} True if the variable is empty
 */
function isEmpty(variable) {
    switch (typeof variable) { // Check the type of the variable
        case "object":
            if (variable == null) { // Check if the object is null
                return true;
            }
            if (variable instanceof Array) { // Check if the object is an array
                return variable.length < 1; // Return true if the array is empty
            }
            return Object.keys(variable).length < 1; // Return true if the object is empty
        case "string":
            return variable.length < 1; // Return true if the string is empty
        case "undefined":
            return true; // Return true if the variable is undefined
        case "number":
            if (isNaN(variable)) { // Check if the number is NaN
                return true;
            }
            return variable === 0; // Return true if the number is 0
        case "boolean":
            return !variable; // Return true if the boolean is false
        default:
            return false;
    }
}

/**
 * Calculates the offset of a point from a current point based on an angle and distance using the cos function
 * @param {number} coordinates The current coordinates of the point
 * @param {number} mid Half the road width
 * @param {number} offset Offset from the edge of the road
 * @param {number} angle The angle of the point
 * @returns {number} The new coordinates of the point
 */
function calculateOffsetCosCoords (coordinates, mid, offset, angle) {
    let length = mid - offset;

    if (length === 0) {
        return coordinates;
    }

    let target = (Math.cos(angle) * length);

    return coordinates + target;
}

/**
 * Calculates the offset of a point from a current point based on an angle and distance using the sin function
 * @param {number} coordinates The current coordinates of the point
 * @param {number} mid Half the road width
 * @param {number} offset Offset from the edge of the road
 * @param {number} angle The angle of the point
 * @returns {number} The new coordinates of the point
 */
function calculateOffsetSinCoords(coordinates, mid, offset, angle) {
    let length = mid - offset; // Calculate the length of the offset

    if (length === 0) { // Check if the length is 0
        return coordinates; // Return the original coordinates
    }

    let target = (Math.sin(angle) * length); // Calculate the target coordinates

    return coordinates - target; // Return the new coordinates
}

/**
 * Truncates an angle to a given range
 * @param {number} angle The angle to truncate
 * @param {number} truncate The range to truncate to
 * @returns {number} The truncated angle
 */
function truncateAngle(angle, truncate = Math.PI) {
    if (angle < 0) {
        while (angle < 0) { // Loop until the angle is positive
            angle += truncate;
        }
    } else {
        while (angle > truncate) { // Loop until the angle is less than the truncate value
            angle -= truncate;
        }
    }
    return angle; // Return the truncated angle
}

/**
 * Checks if two numbers are approximately equal
 * @param {number} a The first number
 * @param {number} b The second number
 * @param {number} epsilon The maximum difference between the two numbers
 * @returns {boolean} True if the numbers are approximately equal
 */
function approxEqual(a, b, epsilon = 0.00001) {
    return Math.abs(a - b) < epsilon; // Return true if the difference between the two numbers is less than epsilon
}

/**
 * Converts a radial angle to a compass angle
 * @param {number} rad The radial angle
 * @returns {number} The compass angle
 */
function radToDeg(rad) {
    return rad * (180 / Math.PI); // Return the compass angle
}

/**
 * Converts a compass angle to a radial angle
 * @param {number} deg The compass angle
 * @returns {number} The radial angle
 */
function degToRad(deg) {
    return deg * (Math.PI / 180); // Return the radial angle
}

/**
 * Calculates the distance between two points
 * @param {object} p Object of the first point, with a x and y property
 * @param {object} q Object of the second point, with a x and y property
 * @returns {number} The distance between the two points
 */
function distance(p, q) {
    return Math.sqrt(Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2)); // Return the distance between the two points
}

/**
 * Snaps a value to a given interval
 * @param {number} value The value to snap
 * @param {number} snap The interval to snap to
 * @returns {number} The snapped value
 */
function snap(value, snap = 50) {
    return Math.round(value / snap) * snap; // Return the snapped value
}

/**
 * Snaps a angle with a given error correction
 * @param {number} angle The angle to snap
 * @param {number} snap The maximum snap error to correct
 * @returns {number}
 */
function snapAngle(angle, snap = Math.PI / 16) {
    angle = truncateAngle(angle, Math.PI * 2); // Truncate the angle to 2PI

    // Define the snap angles
    let snap_points = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];

    for (let i = 0; i < snap_points.length; i++) { // Loop through the snap points
        if (approxEqual(angle, snap_points[i], snap)) { // Check if the angle is approximately equal to the snap point
            return snap_points[i]; // Return the snap point
        }
    }

    return angle; // Return the original angle if no near snap point were found
}

/**
 * Calculates the angle between two points in respect to a third point.
 * "r" is the rotation point while the points "p" and "q" are the angle endpoints.
 * @param {number} rp Distance from r to p
 * @param {number} rq Distance from r to q
 * @param {number} pq Distance from q to p
 * @returns {number} The angle between the two points
 */
function angleBetweenPoints(rp, pq, rq) {
    return Math.abs(Math.acos((Math.pow(rp, 2) + Math.pow(rq, 2) - Math.pow(pq, 2)) / (2 * rp * rq)));
}

/**
 * Approximates a bezier curve using the de Casteljau algorithm.
 * The algorithm is recursive and will continue to split the lines between the control points until we reach a point on the curve.
 * @param {Array} controlPoints Array of points to approximate
 * @param {number} percent The percent along the curve to approximate
 * @returns {Object} The point on the curve, with x, y and the tangent angle.
 */
function deCasteljausAlgorithm(controlPoints, percent) {
    let len =  controlPoints.length; // Get the length of the control points
    if (len < 2) { // Check if the length is less than 2
        throw new Error('Not enough control points');
    }

    if (len === 2) { // Check if the length is 2, end the recursion
        return interpolateCoordinates(controlPoints[0], controlPoints[1], percent, true);
    }

    let newPoints = []; // Create a new array for the new points
    for (let i = 0; i < len - 1; i++) { // Loop through the control points
        newPoints[i] = interpolateCoordinates(controlPoints[i], controlPoints[i + 1], percent); // Interpolate the points
    }

    return deCasteljausAlgorithm(newPoints, percent); // Recurse with the new points
}

/**
 * Interpolates between two points
 * @param {Object} p The first point
 * @param {Object} q The second point
 * @param {number} percent The percent to interpolate
 * @param {boolean} angle If true the angle between the two points will be returned
 * @returns {Object} The interpolated point, with x, y and the tangent angle.
 */
function interpolateCoordinates(p, q, percent, angle = false) {
    let i = {}; // Create a new object for the interpolated point
    i.x = p.x + (q.x - p.x) * percent; // Interpolate the x coordinate
    i.y = p.y + (q.y - p.y) * percent; // Interpolate the y coordinate
    if (angle) { // Check if we should return the angle
        i.angle = Math.atan2(p.x - q.x, p.y - q.y); // Calculate the angle between the two points
    }
    return i; // Return the interpolated point
}

/**
 *
 * @param {Array} points Array of points to approximate
 * @param {number} mid Width of the road
 * @param {number} offset Offset of the line on the road
 * @returns {string} The SVG path
 */
function approximateBezierCurve(points, mid, offset) {
    let path = 'M '; // Create a new path

    // Add the start point
    path += calculateOffsetCosCoords(points[0].x, mid, offset, points[0].angle) + ',';
    path += calculateOffsetSinCoords(points[0].y, mid, offset, points[0].angle) + ' ';

    // Add the points on the curve
    for (let i = 1; i < points.length - 1; i++) {
        path += 'L ' + calculateOffsetCosCoords(points[i].x, mid, offset, points[i].angle) + ',';
        path += calculateOffsetSinCoords(points[i].y, mid, offset, points[i].angle) + ' ';
    }

    // Add the end point
    // Flip the angle for the end side of the road, else the last point will be mirrored
    let angle = truncateAngle(points[points.length - 1].angle + Math.PI, 2 * Math.PI);
    path += 'L ' + calculateOffsetCosCoords(points[points.length - 1].x, mid, offset, angle) + ',';
    path += calculateOffsetSinCoords(points[points.length - 1].y, mid, offset, angle);
    return path;
}

/**
 * Calculates the distance between a Array of points
 * @param {Array} points Array of points
 * @returns {number} The sum of the distance between the points
 */
function approximateDistance(points) {
    let d = 0;
    for (let i = 0; i < points.length - 1; i++) {
        d += distance(points[i], points[i + 1]);
    }
    return d;
}

function minOffset(offset, min = 100) {
    if (offset < 0) {
        return Math.min(offset, -min);
    }
    return Math.max(offset, min);
}

function directionToRad(direction) {
    switch (direction) {
        case 'north':
            return 0;
        case 'east':
            return Math.PI * 1.5;
        case 'south':
            return Math.PI;
        case 'west':
            return Math.PI * 0.5;
        default:
            throw new Error('Invalid direction');
    }
}

function currentTime() {
    let now = new Date();
    return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
}

function downloadAsJson(data, filename = '') {
    if (isEmpty(filename)) {
        filename = currentTime();
    }
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    let downloadAnchorNode = document.createElement('a');
    let exportName = currentTime();
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".map");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function setCookie(name, value, expirationDays) {
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays*86400000));
    let expires = "expires="+ date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
}

function getCookie(name) {
    name += "=";
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let current = cookies[i].trim();
        if ((current.indexOf(name)) === 0) {
            return current.substring(name.length);
        }
    }
    return null;
}

function getSnappedMiddleOfScreen() {
    return {
        x: snap((window.innerWidth / 2) + $(document).scrollLeft()),
        y: snap((window.innerHeight / 2) + $(document).scrollTop())
    }
}

function getConfig(name) {
    try {
        return CONFIG[name];
    } catch (e) {
        let defaultConfig = {
            grid_size: 50,
            road_border_width: 2,
            road_lane_width: 20
        };
        return defaultConfig[name];
    }
}