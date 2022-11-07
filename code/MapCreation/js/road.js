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
    _grab_points = null;

    _lane_width = 20;

    // Stored Values
    _lanes = null;
    _lines = [];
    _bike_lanes = [];

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
        this._start = {x: start_x, y: start_y, angle: start_angle};
        this._end = {x: end_x, y: end_y, angle: end_angle};
        this._lanes = [];
        this._grab_points = {};

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
        this._self.append(this._border, this._asphalt, this._bike_lane_container, this._lines_container);

        // Create the grab points
        let points = ['start', 'end', 'start_angle', 'end_angle'];
        for (let i = 0; i < points.length; i++) {
            let point = $('<div class="grabbable"></div>');
            point.data('road', this).data('type', points[i]);
            this._grab_points[points[i]] = point;
            $('div.grabpoints').append(point);
        }

        return this;
    }

    /**
     * Adds a lane to the road
     * @param {string} type The type of lane to add
     * @param {number} direction The direction of the lane
     * @returns {Road} Self reference for chaining
     */
    createLane(type, direction) {
        if (this._lanes.length > 0) { // Check if there are any lanes
            let line = $(svgElement("path")).addClass("road_line"); // Create the line
            this._lines.push(line); // Add the line to the lines array
            this._lines_container.append(line); // Append the line to the lines container
        }

        if (type === 'bike') { // Check if the lane is a bike lane
            let lane = $(svgElement("path")).addClass("bike_path").attr('stroke-width', this._lane_width); // Create the bike lane
            this._bike_lanes.push(lane); // Add the bike lane to the bike lanes array
            this._bike_lane_container.append(lane); // Append the bike lane to the bike lane container
        }

        this._lanes.push({type: type, direction: direction}); // Add the lane to the lanes array

        this.updateRoadWidth().updateLineTypes().updatePosition(); // Update the road width, update the line types, and update the position

        return this;
    }

    /**
     * Deletes a lane from the road
     * @param {number} index The index of the lane to delete
     * @returns {Road} Self reference for chaining
     */
    deleteLane(index) {
        if (index < 0 || index >= this._lanes.length) { // Check if the index is out of bounds
            throw new Error("Index out of bounds"); // Throw an error
        }

        let isBikeLane = this._lanes[index].type === 'bike'; // Check if the lane is a bike lane

        if (this._lanes.length > 0) { // Check if there are any lanes
            $(this._lines[0]).remove(); // Remove the line
            this._lines.splice(0, 1); // Remove the line from the lines array
        }

        if (isBikeLane) { // Check if the lane is a bike lane
            $(this._bike_lanes[0]).remove(); // Remove the bike lane
            this._bike_lanes.splice(0, 1); // Remove the bike lane from the bike lanes array
        }

        this._lanes.splice(index, 1); // Remove the lane from the lanes array

        this.updateRoadWidth().updateLineTypes().updatePosition(); // Update the road width, update the line types, and update the position

        return this;
    }

    /**
     * Updates the road width
     * @returns {Road} Self reference for chaining
     */
    updateRoadWidth() {
        let count = this._lanes.length; // Get the number of lanes
        let width = this._lane_width * count; // Calculate the width of the road

        this._asphalt.attr('stroke-width', width); // Set the width of the asphalt
        this._border.attr('stroke-width', width + 4); // Set the width of the border

        return this;
    }

    /**
     * Updates the position of the road
     * @returns {Road} Self reference for chaining
     */
    updatePosition() {
        // TODO: Make all paths update to the same type of path - use curveType function
        // TODO: Make 180 degree difference work
        // TODO: Make 0 degree difference work

        let children = this._self.find('path.road_asphalt, path.road_border'); // Get the children of the road

        let path = this.calculateOffsetPath();

        for (let i = 0; i < children.length; i++) {
            $(children[i]).attr('d', path);
        }

        children = this._self.find('path.road_line');
        let mid = this._lane_width * this._lanes.length / 2;
        let mid_lane = this._lane_width / 2;

        for (let i = 0; i < children.length; i++) {
            path = this.calculateOffsetPath(mid, this._lane_width * (i + 1));
            $(children[i]).attr('d', path);
        }

        children = this._self.find('path.bike_path');
        let bike_path = 0;
        for (let i = 0; i < this._lanes.length; i++) {
            if (this._lanes[i].type === 'bike') {
                path = this.calculateOffsetPath(mid, this._lane_width * i + mid_lane);
                $(children[bike_path++]).attr('d', path);
            }
        }

        return this;
    }

    curveType() {
        // TODO: Make transitions between curves smooth
        let p = this._start;
        let q = this._end;

        p.angle = truncateAngle(p.angle, 2 * Math.PI);
        q.angle = truncateAngle(q.angle, 2 * Math.PI);

        if (approxEqual(p.angle, q.angle)) { // Check if the angles are the same
            return '0_diff';
        }

        if (approxEqual(p.angle, truncateAngle(q.angle + Math.PI, 2 * Math.PI))) { // Check if are 180 degrees apart
            if (approxEqual(p.x, q.x)) { // Check if the points are the same
                if (approxEqual(p.angle, 0) || approxEqual(q.angle, 0)) {
                    return 'straight';
                } else {
                    return '180_diff'
                }
            }
            if (approxEqual(p.y, q.y)) { // Check if the points are the same
                if (approxEqual(p.angle, Math.PI / 2) || approxEqual(q.angle, Math.PI / 2)) {
                    return 'straight';
                } else {
                    return '180_diff'
                }
            }
        }

        let intersection = this.calculateIntersectionPoint(p, q);

        let pi = distance(p.x, p.y, intersection.x, intersection.y);
        let qi = distance(q.x, q.y, intersection.x, intersection.y);
        let pq = distance(p.x, p.y, q.x, q.y);

        let p_bound = Math.abs(Math.acos((Math.pow(pi, 2) + Math.pow(pq, 2) - Math.pow(qi, 2)) / (2 * pi * pq)));
        let q_bound = Math.abs(Math.acos((Math.pow(qi, 2) + Math.pow(pq, 2) - Math.pow(pi, 2)) / (2 * qi * pq)));

        if (p_bound > Math.PI / 2 || q_bound > Math.PI / 2 || approxEqual(p.angle, q.angle)) {
            return 'cubic_bezier';
        }

        return 'quadratic_bezier';
    }

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
    }

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

    getElement() {
        return this._self;
    }

    getId() {
        return this._id;
    }

    calculateOffsetPath(mid = 0, offset = 0) {
        let px;
        let py;

        let qx;
        let qy;

        if (offset === 0) {
            px = this._start.x;
            py = this._start.y;

            qx = this._end.x;
            qy = this._end.y;
        } else {
            px = calculateOffsetCosCoords(this._start.x, mid, offset, this._start.angle);
            py = calculateOffsetSinCoords(this._start.y, mid, offset, this._start.angle);

            qx = calculateOffsetCosCoords(this._end.x, -mid, -offset, this._end.angle);
            qy = calculateOffsetSinCoords(this._end.y, -mid, -offset, this._end.angle);
        }

        let pa = truncateAngle(this._start.angle, 2 * Math.PI);
        let qa = truncateAngle(this._end.angle, 2 * Math.PI);

        /*if (approxEqual(pa, qa)) { // Check if the angles are the same
            return this.calculateHalfCirclePath(px, py, qx, qy);
        }*/

        pa = truncateAngle(pa);
        qa = truncateAngle(qa);

        /*if (approxEqual(pa, qa)) { // Check if angles are 180 degrees apart
            return this.calculateMidPath(px, py, qx, qy);
        }*/

        let intersection = this.calculateIntersectionPoint({x: px, y: py, angle: pa}, {x: qx, y: qy, angle: qa});

        let pi = distance(px, py, intersection.x, intersection.y);
        let qi = distance(qx, qy, intersection.x, intersection.y);
        let pq = distance(px, py, qx, qy);

        let p_bound = angleBetweenPoints(pi, qi, pq);
        let q_bound = angleBetweenPoints(qi, pi, pq);

        if (p_bound > Math.PI / 2 || q_bound > Math.PI / 2 || approxEqual(pa, qa)) {
            let c = this.calculateCubicPoints(px, py, qx, qy);
            return this.generateCubicBezierPath(px, py, c.pm.x, c.pm.y, c.qm.x, c.qm.y, qx, qy);
        }

        return this.generateQuadraticBezierPath(px, py, intersection.x, intersection.y, qx, qy);
    }

    calculateHalfCirclePath(px, py, qx, qy) {
        let radius = Math.sqrt(Math.pow(px - qx, 2) + Math.pow(py - qy, 2)) / 2;

        return "M " + px + " " + py + " A " + radius + " " + radius + " 0 0 0 " + qx + " " + qy;
    }

    calculateCubicPoints(px, py, qx, qy) {
        let offset = distance(px, py, qx, qy) / 2;

        let pmx = px - Math.sin(this._start.angle) * offset;
        let pmy = py - Math.cos(this._start.angle) * offset;

        let qmx = qx - Math.sin(this._end.angle) * offset;
        let qmy = qy - Math.cos(this._end.angle) * offset;

        return {pm: {x: pmx, y: pmy}, qm: {x: qmx, y: qmy}};

        // return this.generateCubicBezierPath(px, py, pmx, pmy, qmx, qmy, qx, qy);
    }

    calculateIntersectionPoint(p, q) {
        let x2 = Math.sin(p.angle);
        let y2 = Math.cos(p.angle);

        let x1 = Math.sin(q.angle);
        let y1 = Math.cos(q.angle);

        let m = {};

        if (approxEqual(y1, 0)){
            if (approxEqual(x1, 0)) {
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - implement t1");
            }

            let t2 = (p.y - q.y - p.x*y1/x1) / (x2*y1/x1 - y2);

            if (isNaN(t2)){
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - x2*y1/x1 - y2 is NAN");
            }

            m.x = p.x + t2 * x2;
            m.y = p.y + t2 * y2;
        } else {
            if (approxEqual(x2, 0)) {
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - implement t1");
            }

            let t1 = (q.y - p.y - q.x*y2/x2) / (x1*y2/x2 - y1);

            if (isNaN(t1)){
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - x1*y2/x2 - y1 is NAN");
            }

            m.x = q.x + t1 * x1;
            m.y = q.y + t1 * y1;
        }

        // Debug Circles
        // this._self.append($(svgElement("circle")).attr('cx', mx).attr('cy', my).attr('r', 2).attr('fill', 'red'));

        return m;
    }

    generateQuadraticBezierPath(px, py, mx, my, qx, qy) {
        let path = 'M ' + px;
        path += ',' + py;
        path += ' Q ' + mx;
        path += ',' + my;
        path += ' ' + qx;
        path += ',' + qy;

        return path;
    }

    generateCubicBezierPath(px, py, pmx, pmy, qmx, qmy, qx, qy) {
        let path = 'M ' + px;
        path += ',' + py;
        path += ' C ' + pmx;
        path += ',' + pmy;
        path += ' ' + qmx;
        path += ',' + qmy;
        path += ' ' + qx;
        path += ',' + qy;

        return path;
    }

    /**
     * Makes a road draggable when a user clicks a grab point
     * @param {string} type The type of grab point
     * @returns {Road} Self reference for chaining
     */
    startDrag(type) {
        let data = {road: this};
        switch (type) { // Switch depending on the type of grab point
            case 'start':
                data.point = this._start;
            case 'end':
                if (isEmpty(data.point)) {
                    data.point = this._end;
                }
                $(document).on('mousemove', '', data, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data
                    let point = event.data.point; // Get the point from the event data

                    let x = snap(event.pageX); // Get the x position of the mouse
                    let y = snap(event.pageY); // Get the y position of the mouse

                    if (point.x !== x || road._start.y !== y) { // If the position has changed
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

            road._grab_points[event.data.type].removeClass('grabbing'); // Remove the grabbing class from the grab point

            $(document.body).removeClass('grabbing'); // Change the cursor back to the default
            $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
        });

        return this;
    }
}