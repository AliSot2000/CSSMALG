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

    /**
     * Creates a road
     * @constructor
     * @param {string} id The id of the road
     * @param  {number} start_x The x coordinate of the start of the road
     * @param  {number} start_y The y coordinate of the start of the road
     * @param  {number} start_angle The angle of the start of the road
     * @param  {number} end_x The x coordinate of the end of the road
     * @param  {number} end_y The y coordinate of the end of the road
     * @param  {number} end_angle The angle of the end of the road
     */
    constructor(id = '', start_x = 0, start_y = 0, start_angle = 0, end_x = 0, end_y = 0, end_angle = Math.PI) {
        if (isEmpty(id)) { // Check if the id is empty
            throw new Error("Road ID cannot be empty"); // Throw an error
        }

        // Initialize Private Values
        this._id = id;
        let grid_size = getConfig('grid_size');
        this._start = {x: snap(start_x, grid_size), y: snap(start_y, grid_size), angle: start_angle};
        this._end = {x: snap(end_x, grid_size), y: snap(end_y, grid_size), angle: end_angle};
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

    deleteAllLanes() {
        this._lanes = [];
        this._lines = [];
        this._bike_lanes = [];
        this._lines_container.empty();
        this._bike_lane_container.empty();
        return this;
    }

    /**
     * Updates the road width
     * @returns {Road} Self reference for chaining
     */
    updateRoadWidth() {
        let width = this.getRoadWidth(); // Calculate the width of the road

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

        let c = this.calculateCubicPoints(this._start, this._end);
        let control_points = [this._start, c.pm, c.qm , this._end];
        let path = `M ${this._start.x},${this._start.y} C ${c.pm.x},${c.pm.y} ${c.qm.x},${c.qm.y} ${this._end.x},${this._end.y}`;

        for (let i = 0; i < children.length; i++) {
            $(children[i]).attr('d', path);
        }

        let points = [];

        points.push(this._start);
        for (let i = 1; i < 100; i++) {
            points.push(deCasteljausAlgorithm(control_points, i / 100));
        }
        points.push(this._end);

        this._distance = approximateDistance(points);

        children = this._self.find('path.road_line');
        let mid = this.getRoadWidth() / 2;
        let mid_lane = getConfig('road_lane_width') / 2;
        let road_lane_width = getConfig('road_lane_width');

        for (let i = 0; i < children.length; i++) {
            path = approximateBezierCurve(points, mid, road_lane_width * (i + 1));
            $(children[i]).attr('d', path);
        }

        let arrow_length = getConfig('arrow_length') / this._distance;
        this._arrows_container.empty();
        children = this._self.find('path.bike_path');
        let bike_path = 0;
        let arrow;
        let lane;
        let arrow_start;
        let arrow_end;
        let arrow_head;
        let offset;
        for (let i = 0; i < this._lanes.length; i++) {
            lane = this._lanes[i];
            offset = road_lane_width * i + mid_lane;
            if (lane.type === 'bike') {
                path = approximateBezierCurve(points, mid, offset);
                $(children[bike_path++]).attr('d', path);
            }
            if (lane.direction < 0) {
                arrow_start = deCasteljausAlgorithm(control_points, arrow_length);
                arrow_end = deCasteljausAlgorithm(control_points, arrow_length * 2);
                arrow_head = deCasteljausAlgorithm(control_points, arrow_length * 0.2);
            } else {
                arrow_start = deCasteljausAlgorithm(control_points, 1 - arrow_length);
                arrow_end = deCasteljausAlgorithm(control_points, 1 - arrow_length * 2);
                arrow_head = deCasteljausAlgorithm(control_points, 1 - arrow_length * 0.2);
            }

            arrow = 'M ' + calculateOffsetCosCoords(arrow_start.x, mid, offset, arrow_start.angle);
            arrow += ',' + calculateOffsetSinCoords(arrow_start.y, mid, offset, arrow_start.angle);
            path = ' L ' + calculateOffsetCosCoords(arrow_end.x, mid, offset, arrow_end.angle);
            path += ',' + calculateOffsetSinCoords(arrow_end.y, mid, offset, arrow_end.angle);

            this._arrows_container.append($(svgElement("path")).addClass("arrow_line").attr('d', arrow + path));

            if (lane.forward) {
                path = ' L ' + calculateOffsetCosCoords(arrow_head.x, mid, offset, arrow_head.angle);
                path += ',' + calculateOffsetSinCoords(arrow_head.y, mid, offset, arrow_head.angle);

                this._arrows_container.append(createArrow(arrow + path));
            }
            if (lane.left) {
                path = ' L ' + calculateOffsetCosCoords(arrow_start.x, mid, offset + 6 * lane.direction, arrow_head.angle);
                path += ',' + calculateOffsetSinCoords(arrow_start.y, mid, offset + 6 * lane.direction, arrow_head.angle);

                this._arrows_container.append(createArrow(arrow + path));
            }
            if (lane.right) {
                path = ' L ' + calculateOffsetCosCoords(arrow_start.x, mid, offset - 6 * lane.direction, arrow_head.angle);
                path += ',' + calculateOffsetSinCoords(arrow_start.y, mid, offset - 6 * lane.direction, arrow_head.angle);

                this._arrows_container.append(createArrow(arrow + path));
            }
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

        for (let i = 0; i < this._lines.length; i++) {
            line = this._lines[i].removeClass('car_direction bike_direction bike car');

            lane_type = '';

            if (this._lanes[i].type === 'bike' || this._lanes[i + 1].type === 'bike') {
                lane_type += 'bike';
            } else {
                lane_type += 'car';
            }

            if(this._lanes[i].direction !== this._lanes[i + 1].direction) {
                lane_type += '_direction';
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
     * @param {object} p The start point
     * @param {object} q The end point
     * @returns {{qm: {x: number, y: number}, pm: {x: number, y: number}}}
     */
    calculateCubicPoints(p, q) {
        let offset = distance(p, q) / 2; // Calculate the offset

        return {
            pm: {
                x: p.x - Math.sin(this._start.angle) * offset, // Calculate the x coordinate of the first control point
                y: p.y - Math.cos(this._start.angle) * offset // Calculate the y coordinate of the first control point
            },
            qm: {
                x: q.x - Math.sin(this._end.angle) * offset, // Calculate the x coordinate of the second control point
                y: q.y - Math.cos(this._end.angle) * offset // Calculate the y coordinate of the second control point
            }
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

    stopDrag(type) {
        this._grab_points[type].removeClass('grabbed'); // Remove the grabbing class from the grab point

        $(document.body).removeClass('grabbing'); // Change the cursor back to the default
        $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
    }

    connectToIntersection(intersection, type, snap_point) {
        this._grab_points[type + '_angle'].css('display', 'none');
        this._intersections[type] = {intersection: intersection, snap_point: snap_point};
        this.updatePosition().updateGrabPoints();
    }

    getLanes() {
        return this._lanes;
    }

    getLinkedIntersections() {
        return this._intersections;
    }

    checkAndDissconnectFromIntersection(type) {
        if (!isEmpty(this._intersections[type])) {
            this._grab_points[type + '_angle'].css('display', 'block');
            window.setTimeout(function (intersection, snap_point) {
                intersection.disconnectRoad(snap_point)
            }, 500, this._intersections[type].intersection, this._intersections[type].snap_point);
            this._intersections[type] = null;
        }
    }

    remove() {
        this.checkAndDissconnectFromIntersection('start');
        this.checkAndDissconnectFromIntersection('end');
        this._self.remove();
        let points = ['start', 'end', 'start_angle', 'end_angle'];
        for (let i = 0; i < points.length; i++) {
            this._grab_points[points[i]].remove();
        }
    }

    setLanes(lanes) {
        this.deleteAllLanes();
        for (let i = 0; i < lanes.length; i++) {
            this.createLane(lanes[i]);
        }
        this.updateRoadWidth().updateLineTypes().updatePosition().updateGrabPoints();

        if (!isEmpty(this._intersections.start)) {
            this._intersections.start.intersection.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints();
        }
        if (!isEmpty(this._intersections.end)) {
            this._intersections.end.intersection.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints();
        }
    }

    exportSaveData() {
        let data = {
            id: this._id,
            start: this._start,
            end: this._end,
            lanes: this._lanes,
            intersections: {}
        };

        if (!isEmpty(this._intersections.start)) {
            data.intersections.start = {
                id: this._intersections.start.intersection.getId(),
                snap_point: this._intersections.start.snap_point
            }
        }

        if (!isEmpty(this._intersections.end)) {
            data.intersections.end = {
                id: this._intersections.end.intersection.getId(),
                snap_point: this._intersections.end.snap_point
            }
        }

        return data;
    }
}