/**
 * Road Class
 * @class Road
 * @param {string} id The id of the road
 * @param {Point} start The start point of the road
 * @param {Point} end The end point of the road
 */
class Road {
    _id = null; // ID of the road

    // Positions and Angles
    _start = null; // Start Point
    _end = null; // End Point

    // jQuery Elements
    _self = null; // Element of the road
    _border = null; // Element of the border
    _asphalt = null; // Element of the road
    _bike_lane_container = null; // Wrapper for all the bike lanes
    _lines_container = null; // Wrapper for all the lines
    _arrows_container = null; // Wrapper for all the arrows
    _grab_points = null; // All the Grab Points


    // Stored Values
    _lanes = null; // Array of all the lanes
    _lines = []; // Lines
    _bike_lanes = []; // Bike Lanes
    _intersections = null; // Connected Intersections
    _distance = null; // Approximated Distance between the start and end point
    _control_points = null; // Control Points of the bezier curve

    // Simulation
    _simulation_mode = false; // If the road is in simulation mode
    _simulation_points = []; // Array of all the precalculated points on the curve
    _agents = []; // Array of all the agents on the road
    _speed_limit = 30; // Set the speed limit of the road

    /**
     * Creates a road
     * @constructor
     * @param {string} id The id of the road
     * @param {Point} start The start point of the road
     * @param {Point} end The end point of the road
     */
    constructor(id = '', start, end) {
        if (isEmpty(id)) { // Check if the id is empty
            throw new Error("Road ID cannot be empty"); // Throw an error
        }

        this._id = id; // Set the id

        start.snap(); // Snap the start point to the grid
        end.snap(); // Snap the end point to the grid

        this._start = start; // Set the start point
        this._end = end; // Set the end point
        this._lanes = []; // Initialize the lanes array
        this._grab_points = {}; // Initialize the grab points array
        this._intersections = {start: null, end: null}; // Initialize the intersections array

        this.createElement().updatePosition().updateGrabPoints(); // Create the SVG elements, update the position, and update the grab points position
    }

    /**
     * Creates the SVG elements for the road
     * @returns {Road} Self reference for chaining
     */
    createElement() {
        // Create the SVG element
        this._self = $(svgElement("g")).attr("id", this._id).data("road", this).addClass("road");

        this._border = $(svgElement("path")).addClass("road_border"); // Create the border
        this._asphalt = $(svgElement("path")).addClass("road_asphalt"); // Create the asphalt
        this._bike_lane_container = $(svgElement("g")).addClass("bike_lane_container"); // Create the bike lane container
        this._lines_container = $(svgElement("g")).addClass("lines_container"); // Create the lines container
        this._arrows_container = $(svgElement("g")).addClass("arrows_container"); // Create the arrows container
        this._self.append(this._asphalt, this._bike_lane_container, this._lines_container, this._arrows_container); // Append the elements to the SVG element

        // Create the grab points
        let points = ['start', 'end', 'start_angle', 'end_angle']; // Array of all the grab points
        for (let i = 0; i < points.length; i++) { // Loop through all the grab points
            let point = $('<div class="grabbable ' + points[i] + '"></div>'); // Create the grab point
            point.data('link', this).data('type', points[i]); // Set the data
            this._grab_points[points[i]] = point; // Add the grab point to the grab points array
            $('div.grabpoints').append(point); // Append the grab point to the grab points container
        }

        return this;
    }

    /**
     * Adds a lane to the road
     * @param {Object} data The type of lane to add
     * @returns {Road} Self reference for chaining
     */
    createLane(data) {
        if (this._lanes.length > 0) { // Check if there are any lanes
            let line = $(svgElement("path")).addClass("road_line"); // Create the line
            this._lines.push(line); // Add the line to the lines array
            this._lines_container.append(line); // Append the line to the lines container
        }

        if (data.type === 'bike') { // Check if the lane is a bike lane
            let lane = $(svgElement("path")).addClass("bike_path").attr('stroke-width', getConfig('road_lane_width')); // Create the bike lane
            this._bike_lanes.push(lane); // Add the bike lane to the bike lanes array
            this._bike_lane_container.append(lane); // Append the bike lane to the bike lane container
        }

        this._lanes.push(data); // Add the lane to the lanes array

        return this;
    }

    /**
     * Deletes the all Lanes of the road
     * @returns {Road} Self reference for chaining
     */
    deleteAllLanes() {
        this._lanes = []; // Clear the lanes array
        this._lines = []; // Clear the lines array
        this._bike_lanes = []; // Clear the bike lanes array
        this._lines_container.empty(); // Empty the lines container
        this._bike_lane_container.empty(); // Empty the bike lane container
        return this;
    }

    /**
     * Updates the road width
     * @returns {Road} Self reference for chaining
     */
    updateRoadWidth() {
        let width = this.getRoadWidth(); // Calculate the width of the road

        this._mid = width / 2; // Calculate the middle of the road
        this._asphalt.attr('stroke-width', width); // Set the width of the asphalt
        this._border.attr('stroke-width', width + getConfig('road_border_width') * 2); // Set the width of the border

        return this;
    }

    /**
     * Updates the position of the road
     * @returns {Road} Self reference for chaining
     */
    updatePosition() {
        let c = calculateCubicPoints(this._start, this._end); // Calculate the cubic points
        this._control_points = [this._start, c.pm, c.qm , this._end]; // Create the control points array
        let path = `M ${this._start.x},${this._start.y} C ${c.pm.x},${c.pm.y} ${c.qm.x},${c.qm.y} ${this._end.x},${this._end.y}`; // Create the path

        this._asphalt.attr('d', path); // Set the path of the asphalt
        this._border.attr('d', path);

        let points = []; // Clear the points array

        points.push(this._start); // Add the start point to the points array
        for (let i = 1; i < 100; i++) { // Loop through the points
            points.push(deCasteljausAlgorithm(this._control_points, i / 100)); // Add the point to the points array
        }
        points.push(this._end); // Add the end point to the points array

        this._distance = approximateDistance(points); // Calculate the distance of the road

        let children = this._self.find('path.road_line'); // Get the road lines
        let mid_lane = getConfig('road_lane_width') / 2; // Calculate the middle of the lane
        let road_lane_width = getConfig('road_lane_width'); // Get the road lane width

        for (let i = 0; i < children.length; i++) { // Loop through the road lines
            path = approximateBezierCurve(points, this._mid, road_lane_width * (i + 1)); // Calculate the path of the road line
            $(children[i]).attr('d', path); // Set the path of the road line
        }

        let arrow_length = getConfig('arrow_length') / this._distance; // Calculate the length of the arrow
        this._arrows_container.empty(); // Empty the arrows container
        children = this._self.find('path.bike_path'); // Get the bike lanes

        // Create variables for loop
        let bike_path = 0;
        let arrow;
        let lane;
        let arrow_start;
        let arrow_end;
        let arrow_head;
        let offset;

        for (let i = 0; i < this._lanes.length; i++) { // Loop through the lanes
            lane = this._lanes[i]; // Get the lane
            offset = road_lane_width * i + mid_lane; // Calculate the offset of the lane
            if (lane.type === 'bike') { // Check if the lane is a bike lane
                path = approximateBezierCurve(points, this._mid, offset); // Calculate the path of the bike lane
                $(children[bike_path++]).attr('d', path); // Set the path of the bike lane
            }
            if (lane.direction < 0) { // Check if the lane is going backwards
                arrow_start = deCasteljausAlgorithm(this._control_points, arrow_length * 2); // Calculate the start of the arrow
                arrow_end = deCasteljausAlgorithm(this._control_points, arrow_length * 3); // Calculate the end of the arrow
                arrow_head = deCasteljausAlgorithm(this._control_points, arrow_length * 1.2); // Calculate the head of the arrow
            } else {
                arrow_start = deCasteljausAlgorithm(this._control_points, 1 - arrow_length * 2); // Calculate the start of the arrow
                arrow_end = deCasteljausAlgorithm(this._control_points, 1 - arrow_length * 3); // Calculate the end of the arrow
                arrow_head = deCasteljausAlgorithm(this._control_points, 1 - arrow_length * 1.2); // Calculate the head of the arrow
            }

            // Create the arrow path
            arrow = 'M ' + calculateOffsetCosCoords(arrow_start.x, this._mid, offset, arrow_start.angle);
            arrow += ',' + calculateOffsetSinCoords(arrow_start.y, this._mid, offset, arrow_start.angle);
            path = ' L ' + calculateOffsetCosCoords(arrow_end.x, this._mid, offset, arrow_end.angle);
            path += ',' + calculateOffsetSinCoords(arrow_end.y, this._mid, offset, arrow_end.angle);

            // Create the arrow line
            this._arrows_container.append($(svgElement("path")).addClass("arrow_line").attr('d', arrow + path));

            // Create the arrow head depending on the directions you can go
            if (lane.forward) {
                path = ' L ' + calculateOffsetCosCoords(arrow_head.x, this._mid, offset, arrow_head.angle);
                path += ',' + calculateOffsetSinCoords(arrow_head.y, this._mid, offset, arrow_head.angle);

                this._arrows_container.append(createArrow(arrow + path));
            }
            if (lane.left) {
                path = ' L ' + calculateOffsetCosCoords(arrow_start.x, this._mid, offset + 6 * lane.direction, arrow_head.angle);
                path += ',' + calculateOffsetSinCoords(arrow_start.y, this._mid, offset + 6 * lane.direction, arrow_head.angle);

                this._arrows_container.append(createArrow(arrow + path));
            }
            if (lane.right) {
                path = ' L ' + calculateOffsetCosCoords(arrow_start.x, this._mid, offset - 6 * lane.direction, arrow_head.angle);
                path += ',' + calculateOffsetSinCoords(arrow_start.y, this._mid, offset - 6 * lane.direction, arrow_head.angle);

                this._arrows_container.append(createArrow(arrow + path));
            }
        }

        for (let i = 0; i < this._agents.length; i++) { // Loop through the agents
            this._agents[i].initialMapUpdate(); // Update the position of the agent
        }

        return this;
    }

    /**
     * Updates the grab points of the road
     * @returns {Road} Self reference for chaining
     */
    updateGrabPoints() {
        this._grab_points.start.css({ // Set the start grab point
            left: this._start.x,
            top: this._start.y
        });

        this._grab_points.end.css({ // Set the end grab point
            left: this._end.x,
            top: this._end.y
        });

        let start_angle = this._start.angle + Math.PI / 2; // Calculate the start angle, we need to add PI/2 because the angle is the angle of the line and not a position on the road.
        this._grab_points.start_angle.css({ // Set the start angle grab point
            left: calculateOffsetCosCoords(this._start.x, 0, 20, start_angle),
            top: calculateOffsetSinCoords(this._start.y, 0, 20, start_angle)
        });

        let end_angle = this._end.angle + Math.PI / 2; // Calculate the end angle, we need to add PI/2 because the angle is the angle of the line and not a position on the road.
        this._grab_points.end_angle.css({
            left: calculateOffsetCosCoords(this._end.x, 0, 20, end_angle),
            top: calculateOffsetSinCoords(this._end.y, 0, 20, end_angle)
        });

        return this;
    }

    /**
     * Updates the line types of the road
     * @returns {Road} Self reference for chaining
     */
    updateLineTypes() {
        let lane_type; // Create a variable for the lane type
        let line; // Create a variable for the line

        for (let i = 0; i < this._lines.length; i++) { // Loop through the lines
            line = this._lines[i].removeClass('car_direction bike_direction bike car'); // Remove all the line types

            lane_type = ''; // Reset the lane type

            if (this._lanes[i].type === 'bike' || this._lanes[i + 1].type === 'bike') { // Check if the lane is a bike lane
                lane_type += 'bike'; // Add the bike lane type
            } else {
                lane_type += 'car'; // Add the car lane type
            }

            if(this._lanes[i].direction !== this._lanes[i + 1].direction) { // Check if the lane is going backwards
                lane_type += '_direction'; // Add the direction lane type
            }

            line.addClass(lane_type);
        }

        return this;
    }

    /**
     * Returns the Element of the road
     * @returns {jQuery} The Element of the road
     */
    getElement() {
        return this._self;
    }

    getBorder() {
        return this._border;
    }

    /**
     * Returns the id of the road
     * @returns {string} The id of the road
     */
    getId() {
        return this._id;
    }

    /**
     * Returns the width of the road
     * @returns {number} The width of the road
     */
    getRoadWidth() {
        return getConfig('road_lane_width') * this._lanes.length;
    }

    /**
     * Makes a road draggable when a user clicks a grab point
     * @param {string} type The type of grab point
     * @param {Map} map The map the grab point is on
     * @returns {Road} Self reference for chaining
     */
    startDrag(type, map) {
        let data = {road: this, type: type}; // Create the data object
        switch (type) { // Switch depending on the type of grab point
            case 'start': // If the start grab point is clicked
                data.point = this._start; // Set the point to the start point
            case 'end': // If the end grab point is clicked, or if the start grab point is clicked
                this.checkAndDissconnectFromIntersection(type); // Check if the road is connected to an intersection and disconnect it

                if (isEmpty(data.point)) { // Check if the point is empty, which is the case if the end grab point is clicked
                    data.point = this._end; // Set the point to the end point
                }

                data.map = map; // Set the map

                $(document).on('mousemove', '', data, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let target = $(event.target); // Get the target

                    let road = event.data.road; // Get the road from the event data
                    let point = event.data.point; // Get the point from the event data

                    if (target.hasClass('snap_point')) { // Check if the target has the snap point class
                        let intersection = target.data('link'); // Get the intersection from the target
                        intersection.snapRoad(road, point, event.data.type, target.data('type')); // Snap the road to the intersection
                        road.stopDrag(type, event.data.map); // Stop dragging the road
                        return;
                    }

                    let x = snap(event.pageX + $(document.body).scrollLeft(), getConfig('grid_size')); // Get the x position of the mouse
                    let y = snap(event.pageY + $(document.body).scrollTop(), getConfig('grid_size')); // Get the y position of the mouse

                    if (point.x !== x || point.y !== y) { // If the position has changed
                        event.data.map.checkNewSize(point); // Check if the map needs to be resized
                        point.x = x; // Set the start x position
                        point.y = y; // Set the start y position
                        road.updatePosition().updateGrabPoints(); // Update the position and grab points
                    }
                });
                break;
            case 'start_angle': // If the start angle grab point is clicked
                data.point = this._start; // Set the point to the start point
            case 'end_angle': // If the end angle grab point is clicked, or if the start angle grab point is clicked
                if (isEmpty(data.point)) { // Check if the point is empty, which is the case if the end angle grab point is clicked
                    data.point = this._end; // Set the point to the end point
                }
                $(document).on('mousemove', '', data, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data
                    let point = event.data.point; // Get the point from the event data

                    point.angle = snapAngle(Math.atan2(event.pageX + $(document.body).scrollLeft() - point.x, event.pageY + $(document.body).scrollTop() - point.y)); // Calculate the angle from the start point to the mouse

                    road.updatePosition().updateGrabPoints(); // Update the road position and grab points
                });
                break;
            default:
                throw new Error(`"${type}" is a invalid grabbable type`); // Throw an error if the type is invalid
        }
        $(document).on('mouseup', '', {road: this, type: type, map: map}, function (event) { // When the mouse is released
            event.preventDefault(); // Prevent the default action
            let road = event.data.road; // Get the road from the event data

            road.stopDrag(event.data.type, event.data.map); // Stop dragging the road
        });

        return this;
    }

    /**
     * Stops dragging a road
     * @param {string} type The type of grab point
     * @param {Map} map The map the grab point is on
     */
    stopDrag(type, map = null) {
        this._grab_points[type].removeClass('grabbed'); // Remove the grabbing class from the grab point

        $(document.body).removeClass('grabbing'); // Change the cursor back to the default
        $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
        if (type === 'start' || type === 'end') {
            map.recheckSize(); // Recheck the size of the map
        }
    }

    /**
     * Connects the road to an intersection
     * @param {Intersection} intersection The intersection to connect to
     * @param {string} type The side of the road that is connected
     * @param {string} snap_point The snap point that is connected
     */
    connectToIntersection(intersection, type, snap_point) {
        this._grab_points[type + '_angle'].css('display', 'none'); // Hide the angle grab point
        this._intersections[type] = {intersection: intersection, snap_point: snap_point}; // Set the intersection
        this.updatePosition().updateGrabPoints(); // Update the position and grab points
    }

    /**
     * Gets all the lanes of the road
     * @returns {Array.<Object>} The lanes of the road
     */
    getLanes() {
        return this._lanes; // Return the lanes
    }

    /**
     * Returns all connected intersections
     * @returns {Object} The connected intersections
     */
    getLinkedIntersections() {
        return this._intersections; // Return the intersections
    }

    /**
     * Disconnects the road from an intersection if it is connected
     * @param {string} type The side of the road that is connected
     */
    checkAndDissconnectFromIntersection(type) {
        if (!isEmpty(this._intersections[type])) { // If the road is connected to an intersection
            this._grab_points[type + '_angle'].css('display', 'block'); // Show the angle grab point
            window.setTimeout(function (intersection, snap_point) { // Wait for the road to be removed from the intersection
                intersection.disconnectRoad(snap_point) // Disconnect the road from the intersection
            }, 500, this._intersections[type].intersection, this._intersections[type].snap_point); // Set the timeout and parameters
            this._intersections[type] = null; // Set the intersection to null
        }
    }

    /**
     * Deletes itself
     */
    remove() {
        this.checkAndDissconnectFromIntersection('start'); // Check and disconnect from the start intersection
        this.checkAndDissconnectFromIntersection('end'); // Check and disconnect from the end intersection
        console.log(this._agents)
        this._self.remove(); // Remove the road from the DOM
        this._border.remove();
        this.removeAgents(this._agents.length); // Remove all agents
        let points = ['start', 'end', 'start_angle', 'end_angle'];
        for (let i = 0; i < points.length; i++) { // Loop through the grab points
            this._grab_points[points[i]].remove(); // Remove the grab point from the DOM
        }
    }

    /**
     * Updates the lanes of the road
     * @param {Array.<Object>} lanes The new lanes
     * @returns {Road} Self reference for chaining
     */
    setLanes(lanes) {
        this.deleteAllLanes(); // Delete all the lanes
        for (let i = 0; i < lanes.length; i++) {
            this.createLane(lanes[i]); // Create a new lane
        }
        this.updateRoadWidth().updateLineTypes().updatePosition().updateGrabPoints(); // Update the road width, line types, position and grab points

        if (!isEmpty(this._intersections.start)) { // If the road is connected to an intersection
            this._intersections.start.intersection.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints().updateTrafficControllers(); // Update the intersection width, height, position, grab point and snap points
        }
        if (!isEmpty(this._intersections.end)) { // If the road is connected to an intersection
            this._intersections.end.intersection.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints().updateTrafficControllers(); // Update the intersection width, height, position, grab point and snap points
        }

        return this;
    }


    /**
     * Exports the road to an object
     * @returns {Object} The exported road
     */
    exportSaveData() {
        let data = {
            id: this._id, // The id of the road
            start: this._start.export(), // The start point of the road
            end: this._end.export(), // The end point of the road
            lanes: this._lanes, // The lanes of the road
            intersections: {}, // The intersections of the road
            distance: this._distance, // The distance of the road
            speed_limit: this._speed_limit // The speed limit of the road
        };

        if (!isEmpty(this._intersections.start)) { // If the start of the road is connected to an intersection
            data.intersections.start = { // Set the start intersection
                id: this._intersections.start.intersection.getId(), // The id of the intersection
                snap_point: this._intersections.start.snap_point // The snap point of the intersection
            }
        }

        if (!isEmpty(this._intersections.end)) { // If the end of the road is connected to an intersection
            data.intersections.end = { // Set the end intersection
                id: this._intersections.end.intersection.getId(), // The id of the intersection
                snap_point: this._intersections.end.snap_point // The snap point of the intersection
            }
        }

        return data;
    }

    /**
     * Gets all the lanes that are facing the given direction
     * @param {number} direction The direction to check
     * @returns {Array.<Object>} The lanes that are facing the given direction
     */
    getLanesInDirection(direction) {
        let lanes = []; // The lanes that are facing the given direction
        for (let i = 0; i < this._lanes.length; i++) { // Loop through the lanes
            if (this._lanes[i].direction === direction) { // If the lane is facing the given direction
                lanes.push(this._lanes[i]); // Add the lane to the lanes array
            }
        }
        return lanes;
    }

    /**
     * Exports the road for the simulation
     * @returns {Object} The exported road
     */
    exportToBeSimulatedData() {
        let pixels_per_meter = getConfig('pixels_to_meter'); // The pixels per meter
        let roads = []; // The roads

        let forward = this.getLanesInDirection(1); // Get the forward lanes
        let backward = this.getLanesInDirection(-1); // Get the backward lanes

        let intersections = {} // The intersections

        if (!isEmpty(this._intersections.start)) { // If the start of the road is connected to an intersection
            intersections.start = { // Set the start intersection
                id: this._intersections.start.intersection.getId() // The id of the intersection
            }
        }

        if (!isEmpty(this._intersections.end)) { // If the end of the road is connected to an intersection
            intersections.end = { // Set the end intersection
                id: this._intersections.end.intersection.getId() // The id of the intersection
            }
        }

        if (!isEmpty(forward)) {
            let types = split_by_type(forward); // Split the lanes by type

            for (let type in types) { // Loop through the types
                let lanes = types[type]; // The lanes of the type

                let road = { // Set the forward road
                    id: this._id, // The id of the road
                    lanes: lanes, // The lanes of the road
                    intersections: intersections, // The intersections of the road
                    distance: this._distance * pixels_per_meter, // The distance of the road
                    speed_limit: this._speed_limit // The speed limit of the road
                };
                if (!isEmpty(backward)) road.oppositeStreetId = '!' + this._id; // If the road has backward lanes, set the opposite street id
                roads.push(road);
            }
        }
        if (!isEmpty(backward)) {
            let reverse_intersections = {}; // The reverse intersections
            if (!isEmpty(intersections.start)) { // If the start of the road is connected to an intersection
                reverse_intersections.end = intersections.start; // Set the end intersection
            }
            if (!isEmpty(intersections.end)) { // If the end of the road is connected to an intersection
                reverse_intersections.start = intersections.end; // Set the start intersection
            }

            let types = split_by_type(backward); // Split the lanes by type

            for (let type in types) { // Loop through the types
                let lanes = types[type]; // The lanes of the type

                let road = { // Set the backward road
                    id: '!' + this._id, // The id of the road. The id is prefixed with a '!' to indicate that it is a reverse road
                    lanes: lanes, // The lanes of the road
                    intersections: reverse_intersections, // The intersections of the road
                    distance: this._distance * pixels_per_meter, // The distance of the road
                    speed_limit: this._speed_limit // The speed limit of the road
                };
                if (!isEmpty(forward)) road.oppositeStreetId = this._id; // If the road has forward lanes, set the opposite street id
                roads.push(road);
            }
        }

        return roads;
    }

    /**
     * Calculates where to position an agent, depending on the percent to the end and the offset to the right side
     * @param {number} percent The percent to the end
     * @param {number} offset The offset to the right side
     * @returns {Point} The position of the agent
     */
    getAgentPosition(percent, offset) {
        let point; // The position of the agent
        percent = offsetPercent(this._distance - 32, this._distance, 16, percent);
        if (this._simulation_mode) { // If the road is in simulation mode
            percent = Math.round(percent * 1000) // Round the percent to 3 decimals and convert it to an integer by multiplying it by 1000 and rounding it
            // This gives us a number between 0 and 1000 which should be in the precalculated points
            if(percent < 1) { // If the percent is less than 1
                percent = 1; // Set the percent to 1 as the angle of the first point cannot be calculated
            }
            if(percent > 999) { // If the percent is bigger than 999
                percent = 999; // Set the percent to 999 as the angle of the last point cannot be calculated
            }
            point = this._simulation_points[percent].clone(); // Get the point from the precalculated points
        } else {
            point = deCasteljausAlgorithm(this._control_points, percent); // Calculate the point using de Casteljau's algorithm
        }
        point.x = calculateOffsetCosCoords(point.x, this._mid, offset, point.angle); // Calculate the x coordinate of the point
        point.y = calculateOffsetSinCoords(point.y, this._mid, offset, point.angle); // Calculate the y coordinate of the point
        return point; // Return the point
    }

    /**
     * Switches a road into or out of simulation mode
     * @param {boolean} set Whether to set the road into simulation mode or not
     * @returns {Road} Self Reference for chaining
     */
    simulationMode(set = false) {
        this._simulation_mode = set; // Set the simulation mode
        if (set) { // If the road is switched into simulation mode
            this._simulation_points.push(this._start); // Add the start point to the points array
            for (let i = 1; i < 1000; i++) { // Loop through the points
                this._simulation_points.push(deCasteljausAlgorithm(this._control_points, i / 1000)); // Add the point to the points array
            }
            this._simulation_points.push(this._end); // Add the end point to the points array
        } else {
            this._simulation_points = []; // Reset the points array
        }
        return this;
    }

    /**
     * Returns all the agents on a road
     * @returns {Array.<Agent>} The agents on the road
     */
    getAgents() {
        return this._agents;
    }

    /**
     * Adds an agent to the road
     * @param {Agent} agent The agent to add
     * @returns {Road} Self Reference for chaining
     */
    addAgent(agent) {
        this._agents.push(agent); // Add the agent to the agents array
        return this;
    }

    /**
     * Removes multiple agents from the road. These will be the last agents of a given count.
     * @param {number} count The amount of agents to remove
     * @returns {Road} Self Reference for chaining
     */
    removeAgents(count) {
        this._agents.splice(-count, count); // Remove the agents from the agents array
        return this;
    }

    /**
     * Removes a single agent from the road
     * @param {number} index The index of the agent to remove
     * @returns {Road} Self Reference for chaining
     */
    removeAgent(index) {
        this._agents.splice(index, 1); // Remove the agent from the agents array
        return this;
    }

    /**
     * Gets the current speed limit of the road
     * @returns {number} The speed limit of the road
     */
    getSpeedLimit() {
        return this._speed_limit; // Return the speed limit
    }

    /**
     * Sets the speed limit of the road
     * @param {number} speed_limit The speed limit to set
     * @returns {Road} Self Reference for chaining
     */
    changeSpeedLimit(speed_limit= 30) {
        this._speed_limit = speed_limit; // Set the speed limit
        return this;
    }

    /**
     * Renames the road to a new id
     * @param {string} name The new id of the road
     * @returns {Road} Self Reference for chaining
     */
    rename(name) {
        this._id = name; // Set the id
        this._self.attr('id', name); // Set the id of the svg element
        return this;
    }
}