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

function calculateCoordsX (x, mid, offset, angle) {
    let length = mid - offset;

    if (length === 0) {
        return x;
    }

    let target = (Math.cos(angle) * length);

    return x + target;
}

function calculateCoordsY(y, mid, offset, angle) {
    let length = mid - offset;

    if (length === 0) {
        return y;
    }

    let target = (Math.sin(angle) * length);

    return y - target;
}

function truncateAngle(angle, truncate = Math.PI) {
    while (angle > truncate) {
        angle -= Math.PI;
    }
    return angle;
}

function approxEqual(a, b, epsilon = 0.00001) {
    return Math.abs(a - b) < epsilon;
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function distance(px, py, qx, qy) {
    return Math.sqrt(Math.pow(px - qx, 2) + Math.pow(py - qy, 2));
}