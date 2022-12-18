/**
 * Creates an SVG element
 * @param {string} type The type of SVG element to create
 * @returns {Element} The SVG element
 */
function svgElement(type) {
    return document.createElementNS("http://www.w3.org/2000/svg", type); // Return the SVG element
}

/**
 * Checks if a variable is empty. This means the value is *null, undefined, length 0, undefined, NaN, 0 or false*
 * @function isEmpty
 * @param {any} variable The variable to check
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
 * @param {number} coordinate The current coordinates of the point
 * @param {number} mid Half the road width
 * @param {number} offset Offset from the edge of the road
 * @param {number} angle The angle of the point
 * @returns {number} The new coordinates of the point
 */
function calculateOffsetCosCoords (coordinate, mid, offset, angle) {
    let length = mid - offset; // Calculate the length of the offset

    if (length === 0) { // Check if the length is 0
        return coordinate; // Return the original coordinates
    }

    let target = (Math.cos(angle) * length); // Calculate the target offset

    return coordinate + target; // Return the new coordinates
}

/**
 * Calculates the offset of a point from a current point based on an angle and distance using the sin function
 * @param {number} coordinate The current coordinate of the point
 * @param {number} mid Half the road width
 * @param {number} offset Offset from the edge of the road
 * @param {number} angle The angle of the point
 * @returns {number} The new coordinates of the point
 */
function calculateOffsetSinCoords(coordinate, mid, offset, angle) {
    let length = mid - offset; // Calculate the length of the offset

    if (length === 0) { // Check if the length is 0
        return coordinate; // Return the original coordinates
    }

    let target = (Math.sin(angle) * length); // Calculate the target offset

    return coordinate - target; // Return the new coordinates
}

/**
 * Calculates the offset coordinates of a point on the road
 * @param {Point} point The point to calculate the offset of
 * @param {number} mid Half the road width
 * @param {number} offset Offset from the edge of the road
 * @returns {Point} The offset point
 */
function calculateOffsetCoords(point, mid, offset) {
    point.x = calculateOffsetCosCoords(point.x, mid, offset, point.angle); // Calculate the x offset
    point.y = calculateOffsetSinCoords(point.y, mid, offset, point.angle); // Calculate the y offset
    return point;
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
 * @param {Point} p Object of the first point, with a x and y property
 * @param {Point} q Object of the second point, with a x and y property
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
 * Snaps an angle with a given error correction
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
 * Approximates a Bézier curve using the de Casteljau algorithm. (Read more on [wikipedia](https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm))
 * The algorithm is recursive and will continue to split the lines between the control points until we reach a point on the curve.
 * @param {Array.<Point>} controlPoints Array of points to approximate
 * @param {number} percent The percent along the curve to approximate
 * @returns {Point} The point on the curve, with x, y and the tangent angle.
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
 * @param {Point} p The first point
 * @param {Point} q The second point
 * @param {number} percent The percent to interpolate
 * @param {boolean} angle If true the angle between the two points will be returned
 * @returns {Point} The interpolated point, with x, y and the tangent angle.
 */
function interpolateCoordinates(p, q, percent, angle = false) {
    let i = new Point(); // Create a new object for the interpolated point
    i.x = p.x + (q.x - p.x) * percent; // Interpolate the x coordinate
    i.y = p.y + (q.y - p.y) * percent; // Interpolate the y coordinate
    if (angle) { // Check if we should return the angle
        i.angle = Math.atan2(p.x - q.x, p.y - q.y); // Calculate the angle between the two points
    }
    return i; // Return the interpolated point
}

/**
 *
 * @param {Array.<Point>} points Array of points to approximate
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
 * Calculates the distance between an Array of points
 * @param {Array.<Point>} points Array of points
 * @returns {number} The sum of the distance between the points
 */
function approximateDistance(points) {
    let d = 0; // Create a new variable for the distance
    for (let i = 0; i < points.length - 1; i++) { // Loop through the points
        d += distance(points[i], points[i + 1]); // Add the distance between the points
    }
    return d; // Return the distance
}

/**
 * Converts a point on the compass to a radian angle
 * @param {string} direction The direction on the compass. Should be one of the following: north, east, south, west
 * @returns {number} The angle in radians
 */
function directionToRad(direction) {
    switch (direction) { // Switch through the direction
        case 'north':
            return 0;
        case 'east':
            return Math.PI * 1.5;
        case 'south':
            return Math.PI;
        case 'west':
            return Math.PI * 0.5;
        default: // If the direction is not valid, throw an error
            throw new Error('Invalid direction');
    }
}

/**
 * Formats the current time to a string
 * @returns {string} The current time
 */
function currentTime() {
    let now = new Date(); // Get the current date
    // Format the date to a string yyyy-mm-dd_hh-mm-ss
    return now.getFullYear() + '-' + padDateTime(now.getMonth() + 1) + '-' + padDateTime(now.getDay()) + '_' + padDateTime(now.getHours()) + '-' + padDateTime(now.getMinutes()) + '-' + padDateTime(now.getSeconds());
}

/**
 * Pads a number with a 0 if it is less than 10
 * @param {number} time The number to pad
 * @returns {string} The padded number
 */
function padDateTime(time) {
    return String(time).padStart(2, '0');
}

/**
 * Downloads a file as a json
 * @param data The data to download
 * @param filename The filename of the file
 * @param extension The extension of the file
 */
function downloadAsJson(data, filename = 'data', extension = 'json') {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)); // Create a data string
    let downloadAnchorNode = document.createElement('a'); // Create a new anchor element
    downloadAnchorNode.setAttribute("href",     dataStr); // Set the href attribute
    downloadAnchorNode.setAttribute("download", filename + '.' + extension); // Set the download attribute
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click(); // Click the anchor element
    downloadAnchorNode.remove(); // Remove the anchor element
}

/**
 * Sets a cookie. (Doesn't work in localhost in Safari)
 * @param {string} name The name of the cookie
 * @param {string} value The value of the cookie
 * @param {number} expirationDays The number of days the cookie should be valid
 */
function setCookie(name, value, expirationDays) {
    const date = new Date();  // Create a new date
    date.setTime(date.getTime() + (expirationDays*86400000)); // Set the time to the current time + the expiration days
    let expires = "expires="+ date.toUTCString(); // Create a string with the expiration date
    document.cookie = name + "=" + value + ";" + expires + ";path=/"; // Set the cookie
}

/**
 * Gets a cookie
 * @param {string} name The name of the cookie
 * @returns {string} The value of the cookie
 */
function getCookie(name) {
    name += "="; // Add the = to the name
    let cookies = document.cookie.split(';'); // Split the cookies
    for (let i = 0; i < cookies.length; i++) { // Loop through the cookies
        let current = cookies[i].trim(); // Trim the current cookie
        if ((current.indexOf(name)) === 0) { // Check if the current cookie starts with the name
            return current.substring(name.length); // Return the value of the cookie
        }
    }
    throw new Error('Cookie not found');
}

/**
 * Gets the snapped middle of the screen with scroll offset.
 * @returns {Point} The middle of the screen
 */
function getSnappedMiddleOfScreen() {
    let point = new Point();
    point.x = snap((window.innerWidth / 2) + $(document.body).scrollLeft());
    point.y = snap((window.innerHeight / 2) + $(document.body).scrollTop());
    return point;
}

/**
 * Creates an arrow element with a given path
 * @param {string} path The path of the arrow
 * @returns {jQuery} The arrow element
 */
function createArrow(path) {
    // Create a new arrow element
    return $(svgElement("path")).addClass("arrow_line").attr({
        'd': path,
        'marker-end': 'url(#arrow)'
    });
}

/**
 * Linearly interpolates between two numbers
 * @param {number} start The start value
 * @param {number} end The end value
 * @param {number} percent The percentage to interpolate
 * @returns {number} The interpolated value
 */
function lerp(start, end, percent) {
    return start + (end - start) * percent;
}

/**
 * Point Class to store a point on the screen
 * @class Point
 * @param {number} x The x coordinate
 * @param {number} y The y coordinate
 * @param {number} angle The angle of the point
 */
class Point {
    _x; // Set the x coordinate
    _y; // Set the y coordinate
    _angle; // Set the angle

    /**
     * Initializes the point
     * @constructor
     * @param {number} x The x coordinate
     * @param {number} y The y coordinate
     * @param {number} angle The angle of the point
     */
    constructor(x = 0, y = 0, angle = 0) {
        this._x = x;
        this._y = y;
        this._angle = angle;
    }

    /**
     * Gets the x coordinate
     * @returns {number} The x coordinate
     */
    get x() {
        return this._x;
    }

    /**
     * Gets the y coordinate
     * @returns {number} The y coordinate
     */
    get y() {
        return this._y;
    }

    /**
     * Gets the angle
     * @returns {number} The angle
     */
    get angle() {
        return this._angle;
    }

    /**
     * Sets the x coordinate
     * @param {number} x The x coordinate
     */
    set x(x) {
        this._x = x;
    }

    /**
     * Sets the y coordinate
     * @param {number} y The y coordinate
     */
    set y(y) {
        this._y = y;
    }

    /**
     * Sets the angle
     * @param {number} angle The angle
     */
    set angle(angle) {
        this._angle = angle;
    }

    /**
     * Sets the x, y coordinates and the angle
     * @param {number} x The x coordinate
     * @param {number} y The y coordinate
     * @param {number} angle The angle of the point
     */
    set(x, y, angle) {
        this._x = x; // Set the x coordinate
        this._y = y; // Set the y coordinate
        this._angle = angle; // Set the angle
    }

    /**
     * Clone the point
     * @returns {Point} The cloned point
     */
    clone() {
        return new Point(this._x, this._y, this._angle); // Return a new point with the same values
    }

    /**
     * Snaps the point to the grid
     * @returns {Point} Self Reference for chaining
     */
    snap() {
        this._x = snap(this._x); // Snap the x coordinate
        this._y = snap(this._y); // Snap the y coordinate
        return this;
    }

    /**
     * Exports the object to a object
     * @returns {{x: number, y: number, angle: number}}
     */
    export() {
        return {x: this._x, y: this._y, angle: this._angle};
    }

    /**
     * Checks if two points are equal in their x and y coordinates
     * @param {Point} point The point to check
     * @returns {boolean} If the points are equal
     */
    equalCoords(point) {
        return this._x === point.x && this._y === point.y && this._angle === point.angle;
    }
}

/**
 * Calculates the percentage of a number
 * @param {number} value The value
 * @param {number} total The total
 * @returns {number} The percentage
 */
function calculatePercent(value, total) {
    return (value / total) * 100; // Return the percentage
}

/**
 * Sanitizes the road ids given by the simulation
 * @param {Array.<String>} roadIds The road ids
 * @returns {Array.<String>} The sanitized road ids
 */
function sanitiseRoadIds(roadIds) {
    for (let i = 0; i < roadIds.length; i++) { // Loop through the road ids
        if (roadIds[i].charAt(0) === '!') { // Check if the road id starts with a !
            roadIds[i] = roadIds[i].substring(1); // Remove the !
        }
    }
    return roadIds;
}

/**
 * Creates a good-looking position of the cubic control points
 * @param {Point} p The start point
 * @param {Point} q The end point
 * @returns {{qm: Point, pm: Point}}
 */
function calculateCubicPoints(p, q) {
    let offset = distance(p, q) / 2; // Calculate the offset

    return {
        pm: new Point(
            p.x - offset * Math.sin(p.angle), // Calculate the x coordinate
            p.y - offset * Math.cos(p.angle) // Calculate the y coordinate
        ),
        qm: new Point(
            q.x - offset * Math.sin(q.angle), // Calculate the x coordinate
            q.y - offset * Math.cos(q.angle) // Calculate the y coordinate
        )
    }
}

/**
 * Maps a percentage space to a new percentage space
 * @param {number} newTotalLength The new total length
 * @param {number} oldTotalLength The old total length
 * @param {number} offset The offset
 * @param {number} percent The percentage value
 * @returns {number}
 */
function offsetPercent(newTotalLength, oldTotalLength, offset, percent) {
    return (offset + (percent * newTotalLength)) / oldTotalLength;
}

function split_by_type(data) {
    let split_data = {};
    for (let i = 0; i < data.length; i++) {
        if (data[i].type in split_data) {
            split_data[data[i].type].push(data[i]);
        } else {
            split_data[data[i].type] = [data[i]];
        }
    }
    return split_data;
}

