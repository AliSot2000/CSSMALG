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
        let road = new Road(this.generateId(), start_x, start_y, start_angle, end_x, end_y, end_angle); // Create the road
        this.addRoad(road); // Add the road to the map
        return road;
    }
}