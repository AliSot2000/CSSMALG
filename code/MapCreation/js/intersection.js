class Intersection {
    _id = null;

    _position = null;
    _size = 0;
    _half_size = 0;

    _self = null;

    _directions = ['north', 'east', 'south', 'west'];

    _grab_point = null;

    _snap_points = null;

    constructor(id, x, y) {
        this._id = id;
        let grid_size = getConfig('grid_size');
        this._position = {x: snap(x, grid_size), y: snap(y, grid_size)};
        this._snap_points = {};

        this.createElement().updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints();
    }

    createElement() {
        // Create the SVG element
        this._self = $(svgElement("g"));
        this._self.attr("id", this._id).data("intersection", this);

        // Set the SVG element's attributes
        this._self.addClass("intersection");
        this._border = $(svgElement("rect")).addClass("intersection_border");
        this._asphalt = $(svgElement("rect")).addClass("intersection_asphalt");
        this._self.append(this._border, this._asphalt);

        this._grab_point = $('<div class="grabbable move"></div>').data('link', this).data('type', 'move');
        $('div.grabpoints').append(this._grab_point);

        for (let i = 0; i < this._directions.length; i++) {
            let point = $('<div class="snap_point ' + this._directions[i] + '"></div>');
            point.data('link', this).data('type', this._directions[i]);
            this._snap_points[this._directions[i]] = {snap_point: point, connected: false};
            $('div.snappoints').append(point);
        }

        return this;
    }

    isConnected(direction) {
        return this._snap_points[direction].connected;
    }

    updatePosition() {
        this._asphalt.attr({
            x: this._position.x - this._half_size,
            y: this._position.y - this._half_size,
            width: this._size,
            height: this._size
        });
        let border_size = getConfig('road_border_width');
        this._border.attr({
            x: (this._position.x - this._half_size) - (this.isConnected('west') ? 0 : border_size),
            y: (this._position.y - this._half_size) - (this.isConnected('north') ? 0 : border_size),
            width: this._size + (this.isConnected('west') ? 0 : border_size) + (this.isConnected('east') ? 0 : border_size),
            height: this._size + (this.isConnected('north') ? 0 : border_size) + (this.isConnected('south') ? 0 : border_size)
        });
        return this;
    }

    updateGrabPointAndSnapPoints() {
        this._grab_point.css({
            left: this._position.x,
            top: this._position.y
        });

        for (let i = 0; i < this._directions.length; i++) {
            let snap_point = this._snap_points[this._directions[i]];
            let position;
            if (!isEmpty(snap_point.road)) {
                position = this.getOffsetForDirection(this._directions[i]);
                snap_point.point.x = position.x;
                snap_point.point.y = position.y;
                snap_point.road.updatePosition().updateGrabPoints();
            }
            position = this.getOffsetForDirection(this._directions[i], 15);
            snap_point.snap_point.css({
                left: position.x,
                top: position.y
            });
        }

        return this;
    }

    getOffsetForDirection (side, offset = 0) {
        switch (side) {
            case 'north':
                return {
                    x: this._position.x,
                    y: this._position.y - this._half_size - offset
                }
            case 'east':
                return {
                    x: this._position.x + this._half_size + offset,
                    y: this._position.y
                }
            case 'south':
                return {
                    x: this._position.x,
                    y: this._position.y + this._half_size + offset
                }
            case 'west':
                return {
                    x: this._position.x - this._half_size - offset,
                    y: this._position.y
                }
            default:
                throw new Error('This direction is not supported');
        }
    }

    updateWidthAndHeight() {
        this._size = this.getBiggestRoadWidth();
        this._half_size = this._size / 2;

        return this;
    }

    snapRoad(road, point, point_type, snap_point) {
        this._snap_points[snap_point].snap_point.css('display', 'none');
        this._snap_points[snap_point].connected = true;
        this._snap_points[snap_point].road = road;
        this._snap_points[snap_point].point = point;
        this._snap_points[snap_point].point_type = point_type;

        this.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints();

        let position = this.getOffsetForDirection(snap_point);
        point.x = position.x;
        point.y = position.y;
        point.angle = directionToRad(snap_point);
        road.connectToIntersection(this, point_type, snap_point);
    }

    disconnectRoad(snap_point) {
        this._snap_points[snap_point].connected = false;
        delete this._snap_points[snap_point].road;
        delete this._snap_points[snap_point].point;
        delete this._snap_points[snap_point].point_type;
        this._snap_points[snap_point].snap_point.css('display', 'block');
        this.updateWidthAndHeight().updatePosition().updateGrabPointAndSnapPoints();
    }

    getBiggestRoadWidth() {
        let biggest = getConfig('road_lane_width') * 2;
        for (let i = 0; i < this._directions.length; i++) {
            if (this._snap_points[this._directions[i]].connected) {
                biggest = Math.max(biggest, this._snap_points[this._directions[i]].road.getRoadWidth());
            }
        }

        return biggest;
    }

    getId() {
        return this._id;
    }

    getElement() {
        return this._self;
    }

    startDrag(type) {
        $(document).on('mousemove', '', {intersection: this}, function (event) { // When the mouse moves
            event.preventDefault(); // Prevent the default action
            let intersection = event.data.intersection; // Get the road from the event data

            let x = snap(event.pageX, getConfig('grid_size')); // Get the x position of the mouse
            let y = snap(event.pageY, getConfig('grid_size')); // Get the y position of the mouse

            if (intersection._position.x !== x || intersection._position.y !== y) { // If the position has changed
                intersection._position.x = x; // Set the start x position
                intersection._position.y = y; // Set the start y position
                intersection.updatePosition().updateGrabPointAndSnapPoints(); // Update the position and grab points
            }
        });

        $(document).on('mouseup', '', {intersection: this}, function (event) { // When the mouse is released
            event.preventDefault(); // Prevent the default action
            let intersection = event.data.intersection; // Get the road from the event data

            intersection._grab_point.removeClass('grabbed'); // Remove the grabbing class from the grab point

            $(document.body).removeClass('grabbing'); // Change the cursor back to the default
            $(document).off('mousemove').off('mouseup'); // Remove the mouse move and mouse up events
        });

        return this;
    }

    getLinkedRoads() {
        let roads = [];
        for (let i = 0; i < this._directions.length; i++) {
            if (this._snap_points[this._directions[i]].connected) {
                roads.push(this._snap_points[this._directions[i]].road);
            }
        }
        return roads;
    }

    remove() {
        this._self.remove();
        this._grab_point.remove();
        let grid_size = getConfig('grid_size');
        for (let i = 0; i < this._directions.length; i++) {
            let snap_point = this._snap_points[this._directions[i]];
            if (snap_point.connected) {
                snap_point.point.x = snap(snap_point.point.x, grid_size);
                snap_point.point.y = snap(snap_point.point.y, grid_size);
                snap_point.road._grab_points[snap_point.point_type + '_angle'].css('display', 'block');
                snap_point.road.updatePosition().updateGrabPoints();
                this.disconnectRoad(this._directions[i]);
            }
            snap_point.snap_point.remove();
        }
    }

    exportSaveData() {
        let data = {
            id: this._id,
            position: this._position,
            roads: {}
        };

        for (let i = 0; i < this._directions.length; i++) {
            if (this._snap_points[this._directions[i]].connected) {
                data.roads[this._directions[i]] = {
                    id: this._snap_points[this._directions[i]].road.getId(),
                    point_type: this._snap_points[this._directions[i]].point_type
                };
            }
        }

        return data;
    }
}