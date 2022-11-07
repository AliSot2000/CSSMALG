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
                return obj.length < 1; // Return true if the array is empty
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
    if (angle < 0) { // Check if the angle is negative
        while (angle < 0) { // Loop until the angle is positive
            angle += truncate;
        }
    } else {
        while (angle > truncate) { // Loop until the angle is less than the truncate value
            angle -= Math.PI;
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
 * @param {number} px The x coordinate of the first point
 * @param {number} py The y coordinate of the first point
 * @param {number} qx The x coordinate of the second point
 * @param {number} qy The y coordinate of the second point
 * @returns {number} The distance between the two points
 */
function distance(px, py, qx, qy) {
    return Math.sqrt(Math.pow(px - qx, 2) + Math.pow(py - qy, 2)); // Return the distance between the two points
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
 * r is the rotation point while the points p and q are the angle endpoints.
 * @param {number} rp Distance from r to p
 * @param {number} rq Distance from r to q
 * @param {number} pq Distance from q to p
 * @returns {number} The angle between the two points
 */
function angleBetweenPoints(rp, pq, rq) {
    return Math.abs(Math.acos((Math.pow(rp, 2) + Math.pow(rq, 2) - Math.pow(pq, 2)) / (2 * rp * rq)));
}