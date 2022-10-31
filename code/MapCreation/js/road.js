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

    _start_x = null;
    _start_y = null;
    _start_angle = null;
    _end_x = null;
    _end_y = null;
    _end_angle = null;

    _self = null;
    _border = null;
    _asphalt = null;
    _bike_lane_container = null;
    _lines_container = null;

    _lane_width = 20;

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


        this.createElement();
        this.updatePosition();
    }

    createElement() {
        // Create the SVG element
        this._self = $(svgElement("g"));
        this._self.attr("id", this._id);

        // Set the SVG element's attributes
        this._self.addClass("road");
        this._border = $(svgElement("path")).addClass("road_border");
        this._asphalt = $(svgElement("path")).addClass("road_asphalt");
        this._bike_lane_container = $(svgElement("g")).addClass("bike_lane_container");
        this._lines_container = $(svgElement("g")).addClass("lines_container");
        this._self.append(this._border, this._asphalt, this._bike_lane_container, this._lines_container);
    }

    createLane(type, direction) {
        if (this._lanes.length > 0) {
            let line = $(svgElement("path")).addClass("road_line");
            this._lines.push(line);
            this._lines_container.append(line);
        }

        if (type === 'bike') {
            let lane = $(svgElement("path")).addClass("bike_path").attr('stroke-width', this._lane_width);
            this._bike_lanes.push(lane);
            this._bike_lane_container.append(lane);
        }

        this._lanes.push({type: type, direction: direction});

        this.updateLineTypes();
        this.updatePosition();
        this.updateRoadWidth();

        return this;
    }

    deleteLane(index) {
        if (index < 0 || index >= this._lanes.length) {
            return this;
        }

        let isBikeLane = this._lanes[index].type === 'bike';

        if (this._lanes.length > 0) {
            $(this._lines[0]).remove();
            this._lines.splice(0, 1);
        }

        if (isBikeLane) {
            $(this._bike_lanes[0]).remove();
            this._bike_lanes.splice(0, 1);
        }

        this._lanes.splice(index, 1);

        this.updatePosition();
        this.updateLineTypes();
        this.updateRoadWidth();
    }

    updateRoadWidth() {
        let count = this._lanes.length;
        let width = this._lane_width * count;

        this._asphalt.attr('stroke-width', width);
        this._border.attr('stroke-width', width + 4);
    }

    updatePosition() {
        let children = this._self.find('path.road_asphalt, path.road_border');
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
            px = calculateCoordsX(this._start_x, mid, offset, this._start_angle);
            py = calculateCoordsY(this._start_y, mid, offset, this._start_angle);

            qx = calculateCoordsX(this._end_x, -mid, -offset, this._end_angle);
            qy = calculateCoordsY(this._end_y, -mid, -offset, this._end_angle);
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
}