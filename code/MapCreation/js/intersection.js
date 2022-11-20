/**
 * The Intersection class
 * @class Intersection
 * @param {number} id The id of the intersection
 * @param {number} x The x coordinate of the intersection
 * @param {number} y The y coordinate of the intersection
 */
class Intersection {
    _id = null;

    _position = null;
    _size = 0;
    _half_size = 0;

    _self = null;

    _directions = ['north', 'east', 'south', 'west'];

    _grab_point = null;

    _snap_points = null;

    /**
     * Creates a new intersection
     * @constructor
     * @param {number} id The id of the intersection
     * @param {Point} point The coordinate of the intersection
     */
    constructor(id, point) {
        this._id = id; // The ID of the intersection
        let grid_size = getConfig('grid_size'); // The size of the grid
        point.snap(); // Snap the point to the grid
        this._position = point; // The position of the intersection
        this._snap_points = {}; // The snap points of the intersection

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
        this._self.append(this._border, this._asphalt);

        // Create the grab point
        this._grab_point = $('<div class="grabbable move"></div>').data('link', this).data('type', 'move');
        $('div.grabpoints').append(this._grab_point);

        // Create the snap points
        for (let i = 0; i < this._directions.length; i++) {
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

        this.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints(); // Update the position of the intersection

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
        this.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints(); // Update the position of the intersection
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
                intersection.updatePosition().updateGrabPointAndSnapPoints(); // Update the position and grab points
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
     * Gets all the connected roads in an array
     * @returns {Array.<Road>} The connected roads
     */
    getLinkedRoads() {
        let roads = []; // The array of roads

        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            if (this._snap_points[this._directions[i]].connected) { // Check if the snap point is connected
                roads.push(this._snap_points[this._directions[i]].road); // Add the road to the array
            }
        }

        return roads;
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
            roads: {}
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

    exportToBeSimulatedData() {
        let data = { // The data to export
            id: this._id,
            roads: []
        };

        for (let i = 0; i < this._directions.length; i++) { // Loop through the directions
            if (this._snap_points[this._directions[i]].connected) { // Check if the snap point is connected
                let road = this._snap_points[this._directions[i]].road
                let forward = road.getLanesInDirection(1);
                let backward = road.getLanesInDirection(-1);

                if (!isEmpty(forward)) {
                    data.roads.push({
                        id: road.getId()
                    });
                }

                if (!isEmpty(backward)) {
                    data.roads.push({
                        id: '!' + road.getId()
                    });
                }
            }
        }

        return data;
    }

    rename(name) {
        this._id = name;
        this._self.attr('id', name);
        return this;
    }
}