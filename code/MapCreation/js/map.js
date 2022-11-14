/**
 * Map Class
 * @class Map
 *
 * @param {string} selector The selector of the element you would like to be the map
 */
class Map {
    _self = null;
    _road_wrapper = null;
    _roads = null;
    _intersections = null;
    _grid = null;
    _grab_points = null;
    _snap_points = null;

    /**
     * Creates a Map
     * @constructor
     * @param {string} selector The selector of the element you would like to be the map
     */
    constructor(selector = 'div.drawing_area') {
        // Initialize Private Values
        this._self = $(selector);
        this._self.data('map', this);
        this._road_wrapper = $(svgElement("svg")); // Create the SVG element
        this._intersection_wrapper = $(svgElement("svg")); // Create the SVG element
        this._roads = {}; // Create the roads object
        this._intersections = {}; // Create the intersections object
        this._grid = new Grid(50); // Create the grid object
        this._grab_points = $('<div class="grabpoints"></div>');
        this._snap_points = $('<div class="snappoints"></div>');

        this._self.append(
            this._road_wrapper,
            this._intersection_wrapper,
            this._grab_points,
            this._snap_points,
            this._grid.getGrid()
        ); // Add the SVG element to the map

        // Make the grabpoints element draggable
        $('div.grabpoints').on('mousedown', '.grabbable', function(event) {
            event.preventDefault(); // Prevent the default action
            let target = $(event.target); // Get the target element
            let link = target.data('link'); // Get the road object
            target.addClass('grabbed'); // Add the grabbed class to the target
            $(document.body).addClass('grabbing'); // Change the cursor to grabbing
            link.startDrag(target.data('type')); // Start dragging the road
        });

        // Set the SVG element's attributes
        this._road_wrapper.addClass("roads");
        this._intersection_wrapper.addClass("intersections");
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
        } while (this.idInUse(id)); // Check if the id is already in use
        return id; // Return the id
    }

    idInUse(id) {
        return id in this._roads || id in this._intersections;
    }

    /**
     * Adds a road to the map
     * @function addRoad
     * @param  {Road} road The road you would like to add
     * @return {Map} Self reference for chaining
     */
    addRoad(road) {
        this._roads[road.getId()] = road;
        this._road_wrapper.append(road.getElement());
        return this;
    }

    addIntersection(intersection) {
        this._intersections[intersection.getId()] = intersection;
        this._intersection_wrapper.append(intersection.getElement());
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

    createIntersection(x, y) {
        let intersection = new Intersection(this.generateId(), x, y);
        this.addIntersection(intersection);
        return intersection;
    }

    getRoads() {
        return this._roads;
    }

    getIntersections() {
        return this._intersections;
    }

    getRoad(id) {
        return this._roads[id];
    }

    getIntersection(id) {
        return this._intersections[id];
    }

    removeRoad(id) {
        this.getRoad(id).remove();
        delete this._roads[id];
    }

    removeIntersection(id) {
        this.getIntersection(id).remove();
        delete this._intersections[id];
    }

    exportSaveData() {
        let data = {
            roads: {},
            intersections: {},
            peripherals : {}
        };
        for (let id in this._roads) {
            data.roads[id] = this._roads[id].exportSaveData();
        }
        for (let id in this._intersections) {
            data.intersections[id] = this._intersections[id].exportSaveData();
        }
        data.peripherals.saveDate = currentTime();
        data.peripherals.type = 'save';
        return data;
    }

    load(data) {
        if (data.peripherals.type !== 'save') {
            alert("This is not a valid save!");
            throw new Error('Invalid Save Data');
        }

        this.clear();

        for (let id in data.intersections) {
            let intersection = data.intersections[id];
            let i = new Intersection(id, intersection.position.x, intersection.position.y);
            this.addIntersection(i);
        }

        for (let id in data.roads) {
            let road = data.roads[id];
            let r = new Road(id, road.start.x, road.start.y, road.start.angle, road.end.x, road.end.y, road.end.angle);
            this.addRoad(r);
            r.setLanes(road.lanes);
            if (!isEmpty(road.intersections.start)) {
                let intersection = this.getIntersection(road.intersections.start.id);
                intersection.snapRoad(r, r._start, 'start', road.intersections.start.snap_point);
            }
            if (!isEmpty(road.intersections.end)) {
                let intersection = this.getIntersection(road.intersections.end.id);
                intersection.snapRoad(r, r._end, 'end', road.intersections.end.snap_point);
            }
        }

        alert('Finished loading save of ' + data.peripherals.saveDate);

    }

    clear() {
        for (let id in this._roads) {
            this.removeRoad(id);
        }
        for (let id in this._intersections) {
            this.removeIntersection(id);
        }
    }
}