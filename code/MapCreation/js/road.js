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
        this._self.append(this._border, this._asphalt);
    }

    createLane(type, direction) {
        if (this._lanes.length > 0) {
            let line = $(svgElement("path")).addClass("road_line");
            this._lines.push(line);
            this._self.append(line);
        }

        if (type === 'bike') {
            let lane = $(svgElement("path")).addClass("bike_path").attr('stroke-width', this._lane_width);
            this._bike_lanes.push(lane);
            this._self.append(lane);
        }

        this._lanes.push({type: type, direction: direction});

        let count = this._lanes.length;
        let width = this._lane_width * count;

        this._asphalt.attr('stroke-width', width);
        this._border.attr('stroke-width', width + 4);

        this.updateLineTypes();
        this.updatePosition();

        return this;
    }

    updatePosition() {
        let children = this._self.find('path.road_asphalt, path.road_border');
        let path = `M ${this._start_x} ${this._start_y} L ${this._end_x} ${this._end_y}`;
        for (let i = 0; i < children.length; i++) {
            $(children[i]).attr('d', path);
        }

        children = this._self.find('path.road_line');
        let mid = this._lane_width * this._lanes.length / 2;
        let mid_lane = this._lane_width / 2;

        for (let i = 0; i < children.length; i++) {
            path = this.generatePath(mid, this._lane_width * (i + 1));
            $(children[i]).attr('d', path);
        }

        children = this._self.find('path.bike_path');
        let bike_path = 0;
        for (let i = 0; i < this._lanes.length; i++) {
            if (this._lanes[i].type === 'bike') {
                path = this.generatePath(mid, this._lane_width * i + mid_lane);
                $(children[bike_path++]).attr('d', path);
            }
        }
    }

    updateLineTypes() {
        let path;
        let lane_type;
        let line;
        let mid = this._lane_width * this._lanes.length / 2;

        for (let i = 0; i < this._lines.length; i++) {
            line = this._lines[i].removeClass('car_direction bike_direction bike car');
            path = this.generatePath(mid, (i * this._lane_width));

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

    generatePath(mid, offset) {
        let mid_x;
        let mid_y;

        let path = 'M ' + calculateCoordsX(this._start_x, mid, offset, this._start_angle);
        path += ' ' + calculateCoordsY(this._start_y, mid, offset, this._start_angle);
        path += ' L ' + calculateCoordsX(this._end_x, mid, offset, this._end_angle);
        path += ' ' + calculateCoordsY(this._end_y, mid, offset, this._end_angle);

        return path;
    }
}