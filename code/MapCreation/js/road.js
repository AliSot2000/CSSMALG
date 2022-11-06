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
    _start_x = null;
    _start_y = null;
    _start_angle = null;
    _end_x = null;
    _end_y = null;
    _end_angle = null;

    // jQuery Elements
    _self = null;
    _border = null;
    _asphalt = null;
    _bike_lane_container = null;
    _lines_container = null;
    _start_grabbable = null;
    _start_angle_grabbable = null;
    _end_grabbable = null;
    _end_angle_grabbable = null;

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
        this._start_x = start_x;
        this._start_y = start_y;
        this._start_angle = start_angle;
        this._end_x = end_x;
        this._end_y = end_y;
        this._end_angle = end_angle;
        this._lanes = [];

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
        this._start_grabbable = $('<div class="grabbable"></div>').data('road', this).data('type', 'start');
        this._end_grabbable = $('<div class="grabbable"></div>').data('road', this).data('type', 'end');
        this._start_angle_grabbable = $('<div class="grabbable angle"></div>').data('road', this).data('type', 'start_angle');
        this._end_angle_grabbable = $('<div class="grabbable angle"></div>').data('road', this).data('type', 'end_angle');

        $('div.grabpoints').append(this._start_grabbable, this._end_grabbable, this._start_angle_grabbable, this._end_angle_grabbable);

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
        // TODO: Make all paths update to the same type of path
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

    updateGrabPoints() {
        this._start_grabbable.css({
            left: this._start_x,
            top: this._start_y
        });

        this._end_grabbable.css({
            left: this._end_x,
            top: this._end_y
        });

        let start_angle = this._start_angle + Math.PI / 2;
        this._start_angle_grabbable.css({
            left: calculateOffsetCosCoords(this._start_x, 0, 20, start_angle),
            top: calculateOffsetSinCoords(this._start_y, 0, 20, start_angle)
        });

        let end_angle = this._end_angle + Math.PI / 2;
        this._end_angle_grabbable.css({
            left: calculateOffsetCosCoords(this._end_x, 0, 20, end_angle),
            top: calculateOffsetSinCoords(this._end_y, 0, 20, end_angle)
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
            px = this._start_x;
            py = this._start_y;

            qx = this._end_x;
            qy = this._end_y;
        } else {
            px = calculateOffsetCosCoords(this._start_x, mid, offset, this._start_angle);
            py = calculateOffsetSinCoords(this._start_y, mid, offset, this._start_angle);

            qx = calculateOffsetCosCoords(this._end_x, -mid, -offset, this._end_angle);
            qy = calculateOffsetSinCoords(this._end_y, -mid, -offset, this._end_angle);
        }

        let pa = truncateAngle(this._start_angle);
        let qa = truncateAngle(this._end_angle);

        /*if (approxEqual(pa, qa)) {
            return this.calculateHalfCirclePath(px, py, qx, qy);
        }

        if (approxEqual(truncateAngle(pa), truncateAngle(qa))) {
            return this.calculateMidPath(px, py, qx, qy);
        }*/

        let intersection = this.calculateIntersectionPoint(px, py, qx, qy);

        let pi = distance(px, py, intersection.x, intersection.y);
        let qi = distance(qx, qy, intersection.x, intersection.y);
        let pq = distance(px, py, qx, qy);

        let p_bound = Math.abs(Math.acos((Math.pow(pi, 2) + Math.pow(pq, 2) - Math.pow(qi, 2)) / (2 * pi * pq)));
        let q_bound = Math.abs(Math.acos((Math.pow(qi, 2) + Math.pow(pq, 2) - Math.pow(pi, 2)) / (2 * qi * pq)));

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

        let pmx = px - Math.sin(this._start_angle) * offset;
        let pmy = py - Math.cos(this._start_angle) * offset;

        let qmx = qx - Math.sin(this._end_angle) * offset;
        let qmy = qy - Math.cos(this._end_angle) * offset;

        return {pm: {x: pmx, y: pmy}, qm: {x: qmx, y: qmy}};

        // return this.generateCubicBezierPath(px, py, pmx, pmy, qmx, qmy, qx, qy);
    }

    calculateIntersectionPoint(px, py, qx, qy) {
        let pa = this._start_angle;// truncateAngle(this._start_angle);
        let x2 = Math.sin(pa);
        let y2 = Math.cos(pa);

        let qa = this._end_angle;// truncateAngle(this._end_angle);
        let x1 = Math.sin(qa);
        let y1 = Math.cos(qa);

        let mx;
        let my;

        if (approxEqual(y1, 0)){
            if (approxEqual(x1, 0)) {
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - implement t1");
            }

            let t2 = (py - qy - px*y1/x1) / (x2*y1/x1 - y2);

            if (isNaN(t2)){
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - x2*y1/x1 - y2 is NAN");
            }

            mx = px + t2 * x2;
            my = py + t2 * y2;
        } else {
            if (approxEqual(x2, 0)) {
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - implement t1");
            }

            let t1 = (qy - py - qx*y2/x2) / (x1*y2/x2 - y1);

            if (isNaN(t1)){
                // This error is Alex's responsibility
                throw new Error("Error Calculating MidPoints - x1*y2/x2 - y1 is NAN");
            }

            mx = qx + t1 * x1;
            my = qy + t1 * y1;
        }

        // Debug Circles
        // this._self.append($(svgElement("circle")).attr('cx', mx).attr('cy', my).attr('r', 2).attr('fill', 'red'));

        return {x: mx, y: my};
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
        switch (type) { // Switch depending on the type of grab point
            case 'start':
                $(document).on('mousemove', '', {road: this}, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data

                    road._start_x = snap(event.pageX); // Set the start x to the mouse x
                    road._start_y = snap(event.pageY); // Set the start y to the mouse y

                    road.updatePosition().updateGrabPoints(); // Update the road position and grab points
                });
                break;
            case 'end':
                $(document).on('mousemove', '', {road: this}, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data

                    road._end_x = snap(event.pageX); // Set the end x to the mouse x
                    road._end_y = snap(event.pageY); // Set the end y to the mouse y

                    road.updatePosition().updateGrabPoints(); // Update the road position and grab points
                });
                break;
            case 'start_angle':
                $(document).on('mousemove', '', {road: this}, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data

                    road._start_angle = snapAngle(Math.atan2(event.pageX - road._start_x, event.pageY - road._start_y)); // Calculate the angle from the start point to the mouse

                    road.updatePosition().updateGrabPoints(); // Update the road position and grab points
                });
                break;
            case 'end_angle':
                $(document).on('mousemove', '', {road: this}, function (event) { // When the mouse moves
                    event.preventDefault(); // Prevent the default action
                    let road = event.data.road; // Get the road from the event data

                    road._end_angle = snapAngle(Math.atan2(event.pageX - road._end_x, event.pageY - road._end_y)); // Calculate the angle from the end point to the mouse
                    road.updatePosition().updateGrabPoints(); // Update the road position and grab points
                });
                break;
            default:
                throw new Error(`"${type}" is a invalid grabbable type`); // Throw an error if the type is invalid
        }

        $(document).on('mouseup', '', {road: this, type: type}, function (event) { // When the mouse is released
            event.preventDefault(); // Prevent the default action
            let road = event.data.road; // Get the road from the event data
            switch (event.data.type) { // Switch depending on the type of grab point
                case 'start':
                    road._start_grabbable.removeClass('grabbed'); // Remove the grabbed class from the start grabbable
                    break;
                case 'end':
                    road._end_grabbable.removeClass('grabbed'); // Remove the grabbed class from the end grabbable
                    break;
                case 'start_angle':
                    road._start_angle_grabbable.removeClass('grabbed'); // Remove the grabbed class from the start angle grabbable
                    break;
                case 'end_angle':
                    road._end_angle_grabbable.removeClass('grabbed'); // Remove the grabbed class from the end angle grabbable
                    break;
                default:
                    throw new Error(`"${type}" is a invalid grabbable type`); // Throw an error if the type is invalid
            }
            $(document.body).removeClass('grabbing'); // Change the cursor back to the default
            $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
        });

        return this;
    }
}