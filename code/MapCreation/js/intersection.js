class Intersection {
    _id = null;

    _position = null;
    _width = 0;
    _half_width = 0;
    _height = 0;
    _half_height = 0;

    _self = null;

    _north = {connected: false}
    _east = {connected: false}
    _south = {connected: false}
    _west = {connected: false}

    _grab_point = null;

    _snap_points = null;

    _default_size = 40;

    constructor(id, x, y) {
        this._id = id;
        this._position = {x: x, y: y};
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

        let points = ['north', 'east', 'south', 'west'];
        for (let i = 0; i < points.length; i++) {
            let point = $('<div class="snap_point ' + points[i] + '"></div>');
            point.data('link', this).data('type', points[i]);
            this._snap_points[points[i]] = point;
            $('div.snappoints').append(point);
        }

        return this;
    }

    updatePosition() {
        this._asphalt.attr({
            x: this._position.x - this._half_width,
            y: this._position.y - this._half_height,
            width: this._width,
            height: this._height
        });
        this._border.attr({
            x: (this._position.x - this._half_width) - 2,
            y: (this._position.y - this._half_height) - 2,
            width: this._width + 4,
            height: this._height + 4
        });

        return this;
    }

    updateGrabPointAndSnapPoints() {
        this._grab_point.css({
            left: this._position.x,
            top: this._position.y
        });

        this._snap_points.north.css({
            left: this._position.x,
            top: this._position.y - this._half_height - 15
        });

        this._snap_points.east.css({
            left: this._position.x + this._half_width + 15,
            top: this._position.y
        });

        this._snap_points.south.css({
            left: this._position.x,
            top: this._position.y + this._half_height + 15
        });

        this._snap_points.west.css({
            left: this._position.x - this._half_width - 15,
            top: this._position.y
        });

        return this;
    }

    updateWidthAndHeight() {
        this._width = this._default_size;
        this._half_width = this._width / 2;
        this._height = this._default_size;
        this._half_height = this._height / 2;

        return this;
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

            let x = snap(event.pageX); // Get the x position of the mouse
            let y = snap(event.pageY); // Get the y position of the mouse

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
}