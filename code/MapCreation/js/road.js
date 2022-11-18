/**
 * Road Class
 * @class Road
 * @param {string} id The id of the road
 * @param {number} start_x The x coordinate of the start of the road
 * @param {number} start_y The y coordinate of the start of the road
 * @param {number} end_x The x coordinate of the end of the road
 * @param {number} end_y The y coordinate of the end of the road
 */
class Road {
    _id = null;

    // Positions and Angles
    _start = null;
    _end = null;

    // jQuery Elements
    _self = null;
    _border = null;
    _asphalt = null;
    _bike_lane_container = null;
    _lines_container = null;
    _arrows_container = null;
    _grab_points = null;


    // Stored Values
    _lanes = null;
    _lines = [];
    _bike_lanes = [];
    _intersections = null;
    _distance = null;
    _control_points = null;

    // Simulation
    _simulation_mode = false;
    _simulation_points = [];
    _agents = [];

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

        // Initialize Private Values
        this._id = id;
        let grid_size = getConfig('grid_size');

        // Snap Points to grid
        start.snap();
        end.snap();

        this._start = start;
        this._end = end;
        this._lanes = [];
        this._grab_points = {};
        this._intersections = {start: null, end: null};



        this.createElement().updatePosition().updateGrabPoints(); // Create the SVG elements, update the position, and update the grab points position
    }

    /**
     * Creates the SVG elements for the road
     * @returns {Road} Self reference for chaining
     */
    createElement() {
        // Create the SVG element
        this._self = $(svgElement("g"));
        this._self.attr("id", this._id).data("road", this);

        // Set the SVG element's attributes
        this._self.addClass("road");
        this._border = $(svgElement("path")).addClass("road_border");
        this._asphalt = $(svgElement("path")).addClass("road_asphalt");
        this._bike_lane_container = $(svgElement("g")).addClass("bike_lane_container");
        this._lines_container = $(svgElement("g")).addClass("lines_container");
        this._arrows_container = $(svgElement("g")).addClass("arrows_container");
        this._self.append(this._border, this._asphalt, this._bike_lane_container, this._lines_container, this._arrows_container);

        // Create the grab points
        let points = ['start', 'end', 'start_angle', 'end_angle'];
        for (let i = 0; i < points.length; i++) {
            let point = $('<div class="grabbable ' + points[i] + '"></div>');
            point.data('link', this).data('type', points[i]);
            this._grab_points[points[i]] = point;
            $('div.grabpoints').append(point);
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
        let children = this._self.find('path.road_asphalt, path.road_border'); // Get the children of the road

        let c = this.calculateCubicPoints(this._start, this._end); // Calculate the cubic points
        this._control_points = [this._start, c.pm, c.qm , this._end]; // Create the control points array
        let path = `M ${this._start.x},${this._start.y} C ${c.pm.x},${c.pm.y} ${c.qm.x},${c.qm.y} ${this._end.x},${this._end.y}`; // Create the path

        for (let i = 0; i < children.length; i++) { // Loop through the children
            $(children[i]).attr('d', path); // Set the path of the child
        }

        let points = []; // Clear the points array

        points.push(this._start); // Add the start point to the points array
        for (let i = 1; i < 100; i++) { // Loop through the points
            points.push(deCasteljausAlgorithm(this._control_points, i / 100)); // Add the point to the points array
        }
        points.push(this._end); // Add the end point to the points array

        this._distance = approximateDistance(points); // Calculate the distance of the road

        children = this._self.find('path.road_line'); // Get the road lines
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
                arrow_start = deCasteljausAlgorithm(this._control_points, arrow_length); // Calculate the start of the arrow
                arrow_end = deCasteljausAlgorithm(this._control_points, arrow_length * 2); // Calculate the end of the arrow
                arrow_head = deCasteljausAlgorithm(this._control_points, arrow_length * 0.2); // Calculate the head of the arrow
            } else {
                arrow_start = deCasteljausAlgorithm(this._control_points, 1 - arrow_length); // Calculate the start of the arrow
                arrow_end = deCasteljausAlgorithm(this._control_points, 1 - arrow_length * 2); // Calculate the end of the arrow
                arrow_head = deCasteljausAlgorithm(this._control_points, 1 - arrow_length * 0.2); // Calculate the head of the arrow
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
        this._grab_points.start.css({
            left: this._start.x,
            top: this._start.y
        });

        this._grab_points.end.css({
            left: this._end.x,
            top: this._end.y
        });

        let start_angle = this._start.angle + Math.PI / 2;
        this._grab_points.start_angle.css({
            left: calculateOffsetCosCoords(this._start.x, 0, 20, start_angle),
            top: calculateOffsetSinCoords(this._start.y, 0, 20, start_angle)
        });

        let end_angle = this._end.angle + Math.PI / 2;
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
        let lane_type;
        let line;

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

    /**
     * Returns the id of the road
     * @returns {string} The id of the road
     */
    getId() {
        return this._id;
    }

    getRoadWidth() {
        return getConfig('road_lane_width') * this._lanes.length;
    }

    /**
     * Calculates the cubic control points
     * @param {Point} p The start point
     * @param {Point} q The end point
     * @returns {{qm: Point, pm: Point}}
     */
    calculateCubicPoints(p, q) {
        let offset = distance(p, q) / 2; // Calculate the offset

        return {
            pm: new Point(
                p.x - offset * Math.sin(this._start.angle),
                p.y - offset * Math.cos(this._start.angle)
            ),
            qm: new Point(
                q.x - offset * Math.sin(this._end.angle),
                q.y - offset * Math.cos(this._end.angle)
            )
        }
    }

    /**
     * Makes a road draggable when a user clicks a grab point
     * @param {string} type The type of grab point
     * @returns {Road} Self reference for chaining
     */
    startDrag(type) {
        let data = {road: this, type: type};
        switch (type) { // Switch depending on the type of grab point
            case 'start':
                data.point = this._start;
            case 'end':
                this.checkAndDissconnectFromIntersection(type);

                if (isEmpty(data.point)) {
                    data.point = this._end;
                }

                $(document).on('mousemove', '', data, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let target = $(event.target);

                    let road = event.data.road; // Get the road from the event data
                    let point = event.data.point; // Get the point from the event data

                    if (target.hasClass('snap_point')) {
                        let intersection = target.data('link');
                        intersection.snapRoad(road, point, event.data.type, target.data('type'));
                        road.stopDrag(type);
                        return;
                    }

                    let x = snap(event.pageX, getConfig('grid_size')); // Get the x position of the mouse
                    let y = snap(event.pageY, getConfig('grid_size')); // Get the y position of the mouse

                    if (point.x !== x || point.y !== y) { // If the position has changed
                        point.x = x; // Set the start x position
                        point.y = y; // Set the start y position
                        road.updatePosition().updateGrabPoints(); // Update the position and grab points
                    }
                });
                break;
            case 'start_angle':
                data.point = this._start;
            case 'end_angle':
                if (isEmpty(data.point)) {
                    data.point = this._end;
                }
                $(document).on('mousemove', '', data, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data
                    let point = event.data.point; // Get the point from the event data

                    point.angle = snapAngle(Math.atan2(event.pageX - point.x, event.pageY - point.y)); // Calculate the angle from the start point to the mouse

                    road.updatePosition().updateGrabPoints(); // Update the road position and grab points
                });
                break;
            default:
                throw new Error(`"${type}" is a invalid grabbable type`); // Throw an error if the type is invalid
        }

        $(document).on('mouseup', '', {road: this, type: type}, function (event) { // When the mouse is released
            event.preventDefault(); // Prevent the default action
            let road = event.data.road; // Get the road from the event data

            road.stopDrag(event.data.type); // Stop dragging the road
        });

        return this;
    }

    /**
     * Stops dragging a road
     * @param {string} type The type of grab point
     */
    stopDrag(type) {
        this._grab_points[type].removeClass('grabbed'); // Remove the grabbing class from the grab point

        $(document.body).removeClass('grabbing'); // Change the cursor back to the default
        $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
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
     * @returns {Array} The lanes of the road
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
        this._self.remove(); // Remove the road from the DOM
        let points = ['start', 'end', 'start_angle', 'end_angle'];
        for (let i = 0; i < points.length; i++) { // Loop through the grab points
            this._grab_points[points[i]].remove(); // Remove the grab point from the DOM
        }
    }

    /**
     * Updates the lanes of the road
     * @param {Array} lanes The new lanes
     * @returns {Road} Self reference for chaining
     */
    setLanes(lanes) {
        this.deleteAllLanes(); // Delete all the lanes
        for (let i = 0; i < lanes.length; i++) {
            this.createLane(lanes[i]); // Create a new lane
        }
        this.updateRoadWidth().updateLineTypes().updatePosition().updateGrabPoints(); // Update the road width, line types, position and grab points

        if (!isEmpty(this._intersections.start)) { // If the road is connected to an intersection
            this._intersections.start.intersection.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints(); // Update the intersection width, height, position, grab point and snap points
        }
        if (!isEmpty(this._intersections.end)) { // If the road is connected to an intersection
            this._intersections.end.intersection.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints(); // Update the intersection width, height, position, grab point and snap points
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
            distance: this._distance // The distance of the road
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

    getAgentPosition(percent, offset) {
        let point;
        if (this._simulation_mode) {
            percent = Math.round(percent * 1000)
            if(percent === 0) {
                percent = 1;
            }
            if(percent === 1000) {
                percent = 999;
            }
            point = this._simulation_points[percent].clone();
        } else {
            point = deCasteljausAlgorithm(this._control_points, percent);
        }
        point.x = calculateOffsetCosCoords(point.x, this._mid, offset, point.angle);
        point.y = calculateOffsetSinCoords(point.y, this._mid, offset, point.angle);
        return point;
    }

    simulationMode(set) {
        this._simulation_mode = set;
        if (set) {
            this._simulation_points.push(this._start); // Add the start point to the points array
            for (let i = 1; i < 1000; i++) { // Loop through the points
                this._simulation_points.push(deCasteljausAlgorithm(this._control_points, i / 1000)); // Add the point to the points array
            }
            this._simulation_points.push(this._end); // Add the end point to the points array
        } else {
            this._simulation_points = [];
        }
    }

    getAgents() {
        return this._agents;
    }

    addAgent(agent) {
        this._agents.push(agent);
        return this;
    }

    removeAgents(count) {
        this._agents.splice(-count, count);
    }

    removeAgent(index) {
        this._agents.splice(index, 1);
    }
}