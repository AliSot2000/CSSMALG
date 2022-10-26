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
    _end_x = null;
    _end_y = null;

    _self = null;
    _border = null;
    _asphalt = null;

    _lanes = null;

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
    constructor(id = '', start_x = 0, start_y = 0, start_angle = 0, end_x = 0, end_y = 0, end_angle = 0) {
        if (isEmpty(id)) { // Check if the id is empty
            throw new Error("Road ID cannot be empty"); // Throw an error
        }

        // Initialize Private Values
        this._id = id;
        this._start_x = start_x;
        this._start_y = start_y;
        this._end_x = end_x;
        this._end_y = end_y;
        this._lanes = [{type:'bike', direction: -1},{type:'car', direction: -1}, {type:'car', direction: 1}, {type:'bike', direction: 1}];

        this.createElement();
        this.updatePosition();
        this.updateLanes();
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

    updatePosition() {
        let children = this._self.find('path.road_asphalt, path.road_border');
        let path = `M ${this._start_x} ${this._start_y} L ${this._end_x} ${this._end_y}`;
        for (let i = 0; i < children.length; i++) {
            $(children[i]).attr('d', path);
        }
    }

    updateLanes() {
        let count = this._lanes.length;
        let lane_width = 20;
        let width = lane_width * count;

        this._asphalt.attr('stroke-width', width);
        this._border.attr('stroke-width', width + 4);

        let mid = width / 2;
        let mid_lane = lane_width / 2;
        let line;
        let path;

        this._self.find('path.road_line, path.bike_path').remove();

        for (let i = 0; i < count; i++) {
            if (this._lanes[i].type === 'bike') {
                line = $(svgElement("path")).addClass("bike_path");
                path = `M ${this._start_x - mid  + (i * lane_width) + mid_lane} ${this._start_y} L ${this._end_x - mid + (i * lane_width) + mid_lane} ${this._end_y}`;
                line.attr('d', path);
                line.attr('stroke-width', lane_width);
                this._self.append(line);
            }

            if (i >= 1) {
                path = `M ${this._start_x - mid + (i * lane_width)} ${this._start_y} L ${this._end_x - mid + (i * lane_width)} ${this._end_y}`;
                line = $(svgElement("path")).attr('d', path);

                let laneType = 'road_line ';

                if (this._lanes[i - 1].type === 'bike' || this._lanes[i].type === 'bike') {
                    laneType += 'bike';
                } else {
                    laneType += 'car';
                }

                if(this._lanes[i].direction !== this._lanes[i - 1].direction) {
                    laneType += '_direction';
                }

                line.addClass(laneType);

                this._self.append(line);
            }
        }
    }

    getElement() {
        return this._self;
    }

    getId() {
        return this._id;
    }
}