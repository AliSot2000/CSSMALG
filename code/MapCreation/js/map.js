/**
 * Map Class
 * @class Map
 */
class Map {
    _self = null;
    _roads = null;
    _intersections = null;
    _grid = null;

    /**
     * Creates a Map
     * @constructor
     */
    constructor() {
        // Initialize Private Values
        this._self = $(svgElement("svg")); // Create the SVG element
        this._roads = {}; // Create the roads object
        this._intersections = {}; // Create the intersections object
        this._grid = new Grid(50); // Create the grid object

        $('div.drawing_area').append(this._self); // Add the SVG element to the DOM

        // Set the SVG element's attributes
        this._self.addClass("roads");
    }

    /**
     * Generates a random ID for a road or intersection
     * @function generateId
     * @return {string} A unique random ID
     */
    generateId() {
        let id; // Initialize the id variable
        do {
            id = Math.random().toString(16).slice(2); // Generate a random id
        } while (id in this._roads || id in this._intersections); // Check if the id is already in use
        return id; // Return the id
    }

    /**
     * Adds a road to the map
     * @function addRoad
     * @param  {Road} road The road you would like to add
     * @return {Map} Self reference for chaining
     */
    addRoad(road) {
        this._roads[road.getId()] = road;
        this._self.append(road.getElement());
        return this;
    }

    /**
     * Adds a road to the map
     * @function createRoad
     * @param  {number} start_x The x coordinate of the start of the road
     * @param  {number} start_y The y coordinate of the start of the road
     * @param  {number} start_angle The angle of the start of the road
     * @param  {number} end_x The x coordinate of the end of the road
     * @param  {number} end_y The y coordinate of the end of the road
     * @param  {number} end_angle The angle of the end of the road
     * @return {Road} The road object you created
     */
    createRoad(start_x = 0, start_y= 0, start_angle = 0, end_x= 0, end_y= 0, end_angle = Math.PI) {
        let road = new Road(this.generateId(), start_x, start_y, start_angle, end_x, end_y, end_angle);
        this.addRoad(road);
        return road;
    }
}

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