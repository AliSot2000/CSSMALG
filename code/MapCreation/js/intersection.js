/**
 * The Intersection class
 * @class Intersection
 * @param {number} id The id of the intersection
 * @param {Point} point The coordinate of the intersection
 */
class Intersection {
    _id = null; // The position of the intersection

    _position = null; // The position of the intersection
    _size = 0; // The size of the intersection
    _half_size = 0; // Half of the size of the intersection

    _self = null; // The DOM element of the intersection

    _directions = ['north', 'east', 'south', 'west']; // The directions

    _grab_point = null; // The grab point of the intersection

    _snap_points = null; // The snap points of the intersection

    _traffic_controllers = null; // The traffic controllers of the intersection
    _traffic_controllers_wrapper = null; // The wrapper of the traffic controllers
    _roundabout = null; // The roundabout of the intersection

    /**
     * Creates a new intersection
     * @constructor
     * @param {number} id The id of the intersection
     * @param {Point} point The coordinate of the intersection
     */
    constructor(id, point) {
        this._id = id; // The ID of the intersection
        point.snap(); // Snap the point to the grid
        this._position = point; // The position of the intersection
        this._snap_points = {}; // The snap points of the intersection
        this._traffic_controllers = {}; // The traffic controllers of the intersection

        this.createElement().updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints();
    }

    /**
     * Creates the element
     * @returns {Intersection} Self Reference for chaining
     */
    createElement() {
        // Create the SVG element
        this._self = $(svgElement("g"));
        this._self.attr("id", this._id).data("intersection", this);

        // Set the SVG element's attributes
        this._self.addClass("intersection");
        this._border = $(svgElement("rect")).addClass("intersection_border");
        this._asphalt = $(svgElement("rect")).addClass("intersection_asphalt");
        this._traffic_controllers_wrapper = $(svgElement("g")).addClass("intersection_traffic_controllers");
        this._self.append(this._border, this._asphalt, this._traffic_controllers_wrapper);

        // Create the grab point
        this._grab_point = $('<div class="grabbable move"></div>').data('link', this).data('type', 'move');
        $('div.grabpoints').append(this._grab_point);

        // Create the snap points
        for (let i = 0; i < this._directions.length; i++) {
            this._traffic_controllers[this._directions[i]] = {type: 'traffic_light', element: null};
            let point = $('<div class="snap_point ' + this._directions[i] + '"></div>'); // Create the snap point
            point.data('link', this).data('type', this._directions[i]); // Set the data
            this._snap_points[this._directions[i]] = {snap_point: point, connected: false}; // Add the snap point to the snap points
            $('div.snappoints').append(point); // Add the snap point to the DOM
        }

        return this;
    }

    /**
     * Checks if a direction is connected
     * @param {string} direction The direction to check
     * @returns {boolean} True if the direction is connected, false if not
     */
    isConnected(direction) {
        return this._snap_points[direction].connected;
    }

    /**
     * Updates the position of the intersection
     * @returns {Intersection} Self Reference for chaining
     */
    updatePosition() {
        this._asphalt.attr({
            x: this._position.x - this._half_size, // Set the x coordinate
            y: this._position.y - this._half_size, // Set the y coordinate
            width: this._size, // Set the width
            height: this._size // Set the height
        });

        let border_size = getConfig('road_border_width'); // The size of the border
        this._border.attr({
            x: (this._position.x - this._half_size) - (this.isConnected('west') ? 0 : border_size), // Set the x coordinate
            y: (this._position.y - this._half_size) - (this.isConnected('north') ? 0 : border_size), // Set the y coordinate
            width: this._size + (this.isConnected('west') ? 0 : border_size) + (this.isConnected('east') ? 0 : border_size), // Set the width
            height: this._size + (this.isConnected('north') ? 0 : border_size) + (this.isConnected('south') ? 0 : border_size) // Set the height
        });

        if (this.isRoundAbout()) { // Check if the intersection is a roundabout
            this._roundabout.attr({
                cx: this._position.x, // Set the x coordinate
                cy: this._position.y, // Set the y coordinate
                r: this._half_size / 3 // Set the radius
            });
        }
        return this;
    }

    /**
     * Updates the position of the grab point and snap points
     * @returns {Intersection} Self Reference for chaining
     */
    updateGrabPointAndSnapPoints() {
        this._grab_point.css({ // Set the position of the grab point
            left: this._position.x,
            top: this._position.y
        });

        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            let snap_point = this._snap_points[this._directions[i]]; // Get the snap point
            let position; // The position of the snap point
            if (!isEmpty(snap_point.road)) {
                position = this.getOffsetForDirection(this._directions[i]); // Get the position of the snap point
                snap_point.point.x = position.x; // Set the x coordinate of the snap point
                snap_point.point.y = position.y; // Set the y coordinate of the snap point
                snap_point.road.updatePosition().updateGrabPoints(); // Update the position of the road
            }
            position = this.getOffsetForDirection(this._directions[i], 25); // Get the position of the snap point
            snap_point.snap_point.css({ // Set the position of the snap point
                left: position.x,
                top: position.y
            });
        }

        return this;
    }

    /**
     * Gets the offset for a given direction
     * @param {string} side The side to get the offset for. Should be one of the following: north, east, south, west
     * @param {number} offset The offset to add to the position
     * @returns {Point} The offset position
     */
    getOffsetForDirection (side, offset = 0) {
        switch (side) { // Check the side
            case 'north':
                return new Point(this._position.x, this._position.y - this._half_size - offset);
            case 'east':
                return new Point(this._position.x + this._half_size + offset, this._position.y);
            case 'south':
                return new Point(this._position.x, this._position.y + this._half_size + offset);
            case 'west':
                return new Point(this._position.x - this._half_size - offset, this._position.y);
            default: // Invalid side
                throw new Error('This direction is not supported');
        }
    }

    /**
     * Recalculates the width and height of the intersection
     * @returns {Intersection} Self Reference for chaining
     */
    updateWidthAndHeight() {
        this._size = this.getBiggestRoadWidth(); // Get the biggest road width
        this._half_size = this._size / 2; // Get the half of the size

        return this;
    }

    /**
     * Snaps a road to a given point
     * @param {Road} road The road to snap
     * @param {Object} point The end point of the road to snap
     * @param {string} point_type The side of the end point
     * @param {string} snap_point The side of the snap point
     */
    snapRoad(road, point, point_type, snap_point) {
        this._snap_points[snap_point].snap_point.css('display', 'none'); // Hide the snap point
        this._snap_points[snap_point].connected = true; // Set the snap point to connected
        this._snap_points[snap_point].road = road; // Set the road to the snap point
        this._snap_points[snap_point].point = point; // Set the point to the snap point
        this._snap_points[snap_point].point_type = point_type; // Set the point type to the snap point

        this.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints().updateTrafficControllers(); // Update the position of the intersection

        let position = this.getOffsetForDirection(snap_point); // Get the position of the snap point
        point.x = position.x; // Set the x coordinate of the point
        point.y = position.y; // Set the y coordinate of the point
        point.angle = directionToRad(snap_point); // Set the angle of the point
        road.connectToIntersection(this, point_type, snap_point); // Connect the road to the intersection in the road class.
    }

    /**
     * Disconnects a road from the intersection
     * @param {string} snap_point The side of the snap point
     */
    disconnectRoad(snap_point) {
        this._snap_points[snap_point].connected = false; // Set the snap point to disconnected
        delete this._snap_points[snap_point].road; // Delete the road from the snap point
        delete this._snap_points[snap_point].point; // Delete the point from the snap point
        delete this._snap_points[snap_point].point_type; // Delete the point type from the snap point
        this._snap_points[snap_point].snap_point.css('display', 'block'); // Show the snap point
        this.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints().updateTrafficControllers(); // Update the position of the intersection
    }

    /**
     * Gets the biggest road width
     * @returns {number} The biggest road width
     */
    getBiggestRoadWidth() {
        let biggest = getConfig('road_lane_width') * 2; // The default intersection width

        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            if (this._snap_points[this._directions[i]].connected) { // Check if the snap point is connected
                biggest = Math.max(biggest, this._snap_points[this._directions[i]].road.getRoadWidth()); // Get the biggest road width
            }
        }

        return biggest; // Return the biggest road width
    }

    /**
     * Gets the id of the intersection
     * @returns {string} The id of the intersection
     */
    getId() {
        return this._id;
    }

    /**
     * Gets the jQuery object of the intersection
     * @returns {jQuery} The jQuery object of the intersection
     */
    getElement() {
        return this._self;
    }

    /**
     * Starts the drag of the intersection
     * @param {string} type The type of the grab point. (Not used for intersections. Only for roads.)
     * @param {Map} map The map where the intersection is on
     * @returns {Intersection} Self Reference for chaining
     */
    startDrag(type, map) {
        let data = { // The data to pass to the drag function
            intersection: this,
            map: map
        };
        $(document).on('mousemove', '', data, function (event) { // When the mouse moves
            event.preventDefault(); // Prevent the default action
            let intersection = event.data.intersection; // Get the intersection from the event data

            let x = snap(event.pageX + $(document.body).scrollLeft(), getConfig('grid_size')); // Get the x position of the mouse
            let y = snap(event.pageY + $(document.body).scrollTop(), getConfig('grid_size')); // Get the y position of the mouse

            if (intersection._position.x !== x || intersection._position.y !== y) { // If the position has changed
                event.data.map.checkNewSize(intersection._position); // Update the size of the map
                intersection._position.x = x; // Set the start x position
                intersection._position.y = y; // Set the start y position
                intersection.updatePosition().updateGrabPointAndSnapPoints().updateTrafficControllers(); // Update the position and grab points
            }
        });

        $(document).on('mouseup', '', data, function (event) { // When the mouse is released
            event.preventDefault(); // Prevent the default action
            let intersection = event.data.intersection; // Get the intersection from the event data

            intersection._grab_point.removeClass('grabbed'); // Remove the grabbing class from the grab point

            $(document.body).removeClass('grabbing'); // Change the cursor back to the default
            $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
            map.recheckSize(); // Recheck the size of the map
        });

        return this;
    }

    /**
     * Deletes the intersection
     */
    remove() {
        this._self.remove(); // Remove the intersection from the DOM
        this._grab_point.remove(); // Remove the grab point from the DOM
        let grid_size = getConfig('grid_size'); // Get the grid size
        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            let snap_point = this._snap_points[this._directions[i]]; // Get the snap point
            if (snap_point.connected) { // Check if the snap point is connected
                snap_point.point.x = snap(snap_point.point.x, grid_size); // Snap the x coordinate of the road
                snap_point.point.y = snap(snap_point.point.y, grid_size); // Snap the y coordinate of the road
                snap_point.road._grab_points[snap_point.point_type + '_angle'].css('display', 'block'); // Show the angle grab point
                snap_point.road.updatePosition().updateGrabPoints(); // Update the position and grab points of the road
                this.disconnectRoad(this._directions[i]); // Disconnect the road from the intersection
            }
            snap_point.snap_point.remove(); // Remove the snap point from the DOM
        }
    }

    /**
     * Exports the intersection
     * @returns {Object} The exported intersection
     */
    exportSaveData() {
        let data = { // The data to export
            id: this._id,
            position: this._position.export(),
            roads: {},
            isRoundAbout: this.isRoundAbout(),
            traffic_controllers: {
                north: this._traffic_controllers.north.type,
                east: this._traffic_controllers.east.type,
                south: this._traffic_controllers.south.type,
                west: this._traffic_controllers.west.type
            }
        };

        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            if (this._snap_points[this._directions[i]].connected) { // Check if the snap point is connected
                data.roads[this._directions[i]] = { // Add the road to the data
                    id: this._snap_points[this._directions[i]].road.getId(),
                    point_type: this._snap_points[this._directions[i]].point_type
                };
            }
        }

        return data;
    }

    /**
     * Exports the intersection for the simulation
     * @returns {Object} The exported intersection
     */
    exportToBeSimulatedData() {
        let data = { // The data to export
            id: this._id,
            roads: [],
            roundabout: this.isRoundAbout(),
            trafficSignal: this.hasTrafficLight()
        };

        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            if (this._snap_points[this._directions[i]].connected) { // Check if the snap point is connected
                let road = this._snap_points[this._directions[i]].road // Get the road
                let point_type = this._snap_points[this._directions[i]].point_type; // Get the point type
                let forward = road.getLanesInDirection(1); // Get the forward lanes
                let backward = road.getLanesInDirection(-1); // Get the backward lanes

                if (!isEmpty(forward)) { // Check if there are forward lanes
                    let r = {
                        id: road.getId()
                    }
                    if (point_type === 'end') { // Check if the point type is start
                        r.traffic_controller = this._traffic_controllers[this._directions[i]].type; // Set the traffic controller
                    } else {
                        r.traffic_controller = 'outgoing'; // Set the traffic controller
                    }
                    data.roads.push(r);
                }

                if (!isEmpty(backward)) { // Check if there are backward lanes
                    let r = {
                        id: '!' + road.getId()
                    }
                    if (point_type === 'start') { // Check if the point type is start
                        r.traffic_controller = this._traffic_controllers[this._directions[i]].type; // Set the traffic controller
                    } else {
                        r.traffic_controller = 'outgoing'; // Set the traffic controller
                    }
                    data.roads.push(r);
                }
            }
        }

        return data;
    }

    /**
     * Renames the intersection. The id has to be already checked for uniqueness
     * @param {string} name The new id of the intersection
     * @returns {Intersection} Self Reference for chaining
     */
    rename(name) {
        this._id = name; // Set the id
        this._self.attr('id', name); // Set the id of the intersection
        return this;
    }

    /**
     * Updates all the traffic controllers of the intersection
     * @returns {Intersection} Self Reference for chaining
     */
    updateTrafficControllers() {
        this._traffic_controllers_wrapper.empty(); // Empty the traffic controllers wrapper

        for (let i = 0; i < this._directions.length; i++) {
            let direction = this._directions[i]; // Get the direction
            this._traffic_controllers[direction].element = null; // Reset the traffic controller element

            let element;

            if (this._snap_points[direction].connected) { // Check if the snap point is connected
                switch (this._traffic_controllers[direction].type) { // Check the type of the traffic controller
                    case 'stop_sign': // If the traffic controller is a stop sign
                        element = this.generateStopSign(direction); // Generate the stop sign
                        this._traffic_controllers_wrapper.append(element); // Append the rectangle to the traffic controllers wrapper
                        this._traffic_controllers[direction].element = element; // Set the traffic controller element
                        break;
                    case 'traffic_light': // If the traffic controller is a traffic light
                        element = this.generateTrafficLight(direction); // Generate the stop sign
                        this._traffic_controllers_wrapper.append(element); // Append the rectangle to the traffic controllers wrapper
                        this._traffic_controllers[direction].element = element; // Set the traffic controller element
                        break;
                    case 'roundabout': // If the traffic controller is a roundabout
                    case 'yield_sign': // If the traffic controller is a yield sign
                        element = this.generateYieldSign(direction); // Generate the stop sign
                        this._traffic_controllers_wrapper.append(element); // Append the rectangle to the traffic controllers wrapper
                        this._traffic_controllers[direction].element = element; // Set the traffic controller element
                        break;
                    case 'right_of_way': // If the traffic controller is a right of way
                    default: // If the traffic controller is not set
                        // Do nothing as the traffic controller is a right of way
                        break;
                }
            }
        }
        return this;
    }

    /**
     * Generates a stop sign for the intersection in the given direction
     * @param {string} direction The direction the road is connected to the intersection
     * @returns {jQuery} The stop sign
     */
    generateStopSign(direction) {
        let element = $(svgElement('rect')).addClass('stop_sign'); // Create a rectangle
        let attributes = {}; // The attributes of the rectangle
        let position = this.getOffsetForDirection(direction); // Get the position of the traffic controller
        let half_road_width = this._snap_points[direction].road.getRoadWidth() / 2; // Get the half of the road width
        let incoming_road_width = this.getWidthOfIncomingRoad(direction); // Get the width of the incoming road
        let offset = (direction === 'east' || direction === 'north') ? -half_road_width : (half_road_width - incoming_road_width); // Get the offset of the traffic controller
        switch (direction) { // Check the direction
            case 'east': // If the direction is east
                position.x -= 4; // Offset the x position as the stop sign has a width of 4 units.
            case 'west': // If the direction is west or falls through because it was east
                position.y += offset; // Offset the y position
                attributes = { // Set the attributes
                    height: incoming_road_width, // The height of the rectangle
                    width: 4 // The width of the rectangle
                }
                break;
            case 'south': // If the direction is south
                position.y -= 4; // Offset the y position as the stop sign has a width of 4 units.
            case 'north': // If the direction is north or falls through because it was south
                position.x += offset; // Offset the x position
                attributes = { // Set the attributes
                    height: 4, // The height of the rectangle
                    width: incoming_road_width // The width of the rectangle
                }
        }
        attributes.x = position.x; // Set the x position
        attributes.y = position.y; // Set the y position
        element.attr(attributes); // Set the attributes of the rectangle
        return element; // Return the rectangle
    }

    /**
     * Generates a yield sign for the intersection in the given direction
     * @param {string} direction The direction the road is connected to the intersection
     * @returns {jQuery} The yield sign
     */
    generateYieldSign(direction) {
        let element = $(svgElement('line')).addClass('yield_sign'); // Create a line
        let attributes = {}; // The attributes of the line
        let position = this.getOffsetForDirection(direction); // Get the position of the traffic controller
        let half_road_width = this._snap_points[direction].road.getRoadWidth() / 2; // Get the half of the road width
        let incoming_road_width = this.getWidthOfIncomingRoad(direction); // Get the width of the incoming road
        let offset = (direction === 'east' || direction === 'north') ? -half_road_width : (half_road_width - incoming_road_width); // Get the offset of the traffic controller
        switch (direction) { // Check the direction
            case 'east': // If the direction is east
            case 'west': // If the direction is west
                position.y += offset; // Offset the y position
                attributes = { // Set the attributes
                    x1: position.x, // The x position of the first point
                    y1: position.y, // The y position of the first point
                    x2: position.x, // The x position of the second point
                    y2: position.y + incoming_road_width // The y position of the second point
                }
                break;
            case 'south': // If the direction is south
            case 'north': // If the direction is north
                position.x += offset; // Offset the x position
                attributes = { // Set the attributes
                    x1: position.x, // The x position of the first point
                    y1: position.y, // The y position of the first point
                    x2: position.x + incoming_road_width, // The x position of the second point
                    y2: position.y // The y position of the second point
                }

        }
        element.attr(attributes); // Set the attributes of the line
        return element; // Return the line
    }

    /**
     * Generates a traffic light for the intersection in the given direction
     * @param {string} direction The direction the road is connected to the intersection
     * @returns {jQuery} The traffic light
     */
    generateTrafficLight(direction) {
        let traffic_light_wrapper = $(svgElement('g')).addClass('traffic_light_wrapper'); // Create a group
        let position = this.getOffsetForDirection(direction); // Get the position of the traffic controller
        let half_road_width = this._snap_points[direction].road.getRoadWidth() / 2; // Get the half of the road width
        let road = this._snap_points[direction].road; // Get the road
        let point_type = this._snap_points[direction].point_type; // Get the point type
        let lane_width = getConfig('road_lane_width'); // Get the lane width\
        let half_lane_width = lane_width / 2; // Get the half of the lane width
        let lanes = road.getLanesInDirection(point_type === 'start' ? -1 : 1); // Get the lanes in the direction of the road
        let incoming_road_width = lanes.length * lane_width; // Calculate the lane width

        let base_offset = (direction === 'east' || direction === 'north') ? -half_road_width : (half_road_width - incoming_road_width); // Get the base offset of the traffic controller

        for (let i = 0; i < lanes.length; i++) { // Loop through the lanes
            let offset = base_offset + (i * lane_width) + half_lane_width; // Calculate the offset of the traffic light
            let attributes = { // The attributes of the traffic light
                r: 3 // The radius of the traffic light
            };
            switch (direction) { // Check the direction
                case 'east': // If the direction is east
                case 'west': // If the direction is west
                    attributes.cx = position.x; // Set the x position
                    attributes.cy = position.y + offset; // Set the y position
                    break;
                case 'south': // If the direction is south
                case 'north': // If the direction is north
                    attributes.cx = position.x + offset; // Set the x position
                    attributes.cy = position.y; // Set the y position
            }
            let traffic_light = $(svgElement('circle')).addClass('traffic_light').attr(attributes); // Create a circle
            traffic_light_wrapper.append(traffic_light); // Append the traffic light to the wrapper
        }
        return traffic_light_wrapper; // Return the wrapper
    }

    /**
     * Calculates the width of the incoming road
     * @param {string} direction The direction of the incoming road
     * @returns {number} The width of the incoming road
     */
    getWidthOfIncomingRoad(direction) {
        if (this._snap_points[direction].connected) { // Check if the snap point is connected
            let road = this._snap_points[direction].road; // Get the road
            let point_type = this._snap_points[direction].point_type; // Get the point type
            let lanes = road.getLanesInDirection(point_type === 'start' ? -1 : 1); // Get the lanes in the direction of the road
            return lanes.length * getConfig('road_lane_width'); // Return the width of the incoming road
        }
        return 0; // Return 0 if the snap point is not connected
    }

    /**
     * Get the road that is connected to the intersection in the given direction
     * @param {string} direction The direction of the road that is connected to the intersection
     * @returns {Road} The road that is connected to the intersection in the given direction
     */
    getRoadInDirection(direction) {
        return this._snap_points[direction].road; // Return the road in the direction
    }

    /**
     * Get the traffic controller type the is in a given direction
     * @param {string} direction The direction of the traffic controller
     * @returns {string} The traffic controller type
     */
    getTrafficControllerInDirection(direction) {
        return this._traffic_controllers[direction].type; // Return the traffic controller in the direction
    }

    /**
     * Set the traffic controller type in a given direction
     * @param {string} direction The direction of the traffic controller
     * @param {string} type The type of the traffic controller
     * @returns {Intersection} Self Reference for chaining
     */
    setTrafficControllerInDirection(direction = 'north', type = 'traffic_light') {
        if (this._traffic_controllers[direction].type !== type) { // Check if the traffic controller type is different
            this._traffic_controllers[direction].type = type; // Set the traffic controller type
            this.updateTrafficControllers(); // Update the traffic controller
        }
        return this;
    }

    /**
     * Changes the intersection into a roundabout
     * @param {boolean} value Whether the intersection should be a roundabout or not
     */
    setRoundAbout(value = false) {
        if (value) { // Check if the traffic controller is a roundabout
            this._roundabout = $(svgElement('circle')).addClass('roundabout').attr({
                cx: this._position.x, // The x position of the circle
                cy: this._position.y, // The y position of the circle
                r: this._half_size / 3 // The radius of the circle
            }); // Create a circle
            this._self.append(this._roundabout); // Append the roundabout to the intersection
        } else {
            this._roundabout.remove(); // Delete the roundabout
            this._roundabout = null; // Set the roundabout to null
        }
    }

    /**
     * Checks if the intersection is a roundabout
     * @returns {boolean} Whether the intersection is a roundabout or not
     */
    isRoundAbout() {
        return !isEmpty(this._roundabout); // Return if the traffic controller is a roundabout
    }

    /**
     * Checks if the intersection has at least one traffic light
     * @returns {boolean} Whether the intersection has at least one traffic light or not
     */
    hasTrafficLight () {
        for (let direction in this._traffic_controllers) {
            if (this._traffic_controllers[direction].type === 'traffic_light') {
                return true;
            }
        }
        return false;
    }
}