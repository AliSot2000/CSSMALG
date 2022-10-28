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
        let path = this.generatePath(this._start_x, this._start_y, this._end_x, this._end_y);

        for (let i = 0; i < children.length; i++) {
            $(children[i]).attr('d', path);
        }

        children = this._self.find('path.road_line');
        let mid = this._lane_width * this._lanes.length / 2;
        let mid_lane = this._lane_width / 2;

        for (let i = 0; i < children.length; i++) {
            path = this.generateOffsetPath(mid, this._lane_width * (i + 1));
            $(children[i]).attr('d', path);
        }

        children = this._self.find('path.bike_path');
        let bike_path = 0;
        for (let i = 0; i < this._lanes.length; i++) {
            if (this._lanes[i].type === 'bike') {
                path = this.generateOffsetPath(mid, this._lane_width * i + mid_lane);
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

    generateOffsetPath(mid, offset) {
        let px = calculateCoordsX(this._start_x, mid, offset, this._start_angle);
        let py = calculateCoordsY(this._start_y, mid, offset, this._start_angle);

        let qx = calculateCoordsX(this._end_x, mid, offset, this._end_angle);
        let qy = calculateCoordsY(this._end_y, mid, offset, this._end_angle);

        return this.generatePath(px, py, qx, qy);
    }

    generatePath(px, py, qx, qy) {
        let pa = truncateAngle(this._start_angle);
        let x2 = Math.sin(pa);
        let y2 = Math.cos(pa);

        let qa = truncateAngle(this._end_angle);
        let x1= Math.sin(qa);
        let y1 = Math.cos(qa);

        if (y1 === 0){
            // try with x
            if (x1 === 0) {
                alert("SCREAM AT ALEX - implement t1")
                return
            }

            // Dividing by x1
            let t2 = (py - pq - px*y1/x1) / (x2*y1/x1 - y2);
            if (isNaN(t2)){
                alert("SCREAM AT ALEX - x2*y1/x1 - y2 is NAN")
                return
            }

            let t1 = (px + t2*x2)/x1;
        } else {
            let t2 = (px - qx - py*x1/y1) / (y2*x1/y1 - x2);
            let t1 = (py + t2*y2)/y1;
            if (isNaN(t2)){
                alert("SCREAM AT ALEX - y2*x1/y1 - x2 is NAN")
                return
            }
        }

        if (t1 < 0) {
            alert("t1 < 0")
        }
        if (t2 < 0){
            alert("t2 < 0")
        }

        let mx = px + t2 * x2;
        let my = py + t2 * y2;

        this._self.append($(svgElement("circle")).attr('cx', mx).attr('cy', my).attr('r', 2).attr('fill', 'red'));

        return this.generateCurvedPath(px, py, mx, my, qx, qy);
    }

    generateCurvedPath(px, py, mx, my, qx, qy) {
        let path = 'M ' + px;
        path += ',' + py;
        path += ' Q ' + mx;
        path += ',' + my;
        path += ' ' + qx;
        path += ',' + qy;

        return path;
    }
}