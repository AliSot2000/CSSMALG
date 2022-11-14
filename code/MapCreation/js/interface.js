class Interface {
    _self = null;
    _toggle_button = null;
    _body = null;
    _map = null;

    constructor(selector = 'div.interface', map = null) {
        this._self = $(selector).data('interface', this);
        this._map = map;

        this.createElements()
        this.overview();
    }

    createElements() {
        this._toggle_button = $('<button>&#9664;</button>').addClass('interface_toggle').data('interface', this);
        this._toggle_button.on('click', function() {
            $(this).data('interface').toggle();
        });

        this._body = $('<div></div>').addClass('interface_body').on('click', '.interface_button, .small_button, .delete', {interface: this}, function(event) {
            event.data.interface.runCommand($(this).html(), $(this).data(), $(this));
        });

        this._self.append(this._toggle_button, this._body);
    }

    toggle() {
        if (this._self.hasClass('interface_hidden')) {
            this._self.removeClass('interface_hidden');
            this._toggle_button.html('&#9654;');
        } else {
            this._self.addClass('interface_hidden');
            this._toggle_button.html('&#9664;');
        }
    }

    overview() {
        this._body.empty();
        this._body.append('<h2>General</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Save</button>');
        this._body.append('<button class="interface_button">Load</button>');
        this._body.append('<button class="interface_button">Export as Save</button>');
        this._body.append('<button class="interface_button">Export for Simulation</button>');
        this._body.append('<button class="interface_button">Import Save</button>');

        this._body.append('<h2>Creation</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Add Road</button>');
        this._body.append('<button class="interface_button">Add Intersection</button>');

        this._body.append($('<button class="interface_button">Edit Roads</button>'));
        this._body.append('<button class="interface_button">Edit Intersections</button>');
    }

    editRoads() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Roads</h2><div class="spacer"></div>');
        let roads = Object.keys(this._map.getRoads());
        roads.sort();
        for (let road of roads) {
            this._body.append($('<button class="interface_button">' + road + '</button>').data('command', 'editRoad'));
        }
    }

    editRoad(road) {
        let r = this._map.getRoad(road);
        this._body.empty();

        this._body.append('<button class="small_button">Back to Roads</button>');
        this._body.append('<h2>Road: </h2><span>' + road + '</span>');
        this._body.append('<button class="small_button">Edit Name</button><div class="spacer"></div>');
        this._body.append('<h2>Lanes:</h2>');
        this._body.append('<button class="small_button">Add Lane</button>');
        let lane_list = $('<div class="lanes"></div>');
        let lanes = r.getLanes();
        let l;
        let lane;
        for (let i = 0; i < lanes.length; i++) {
            lane = lanes[i];
            l = this.generateLane(i, lane.type === 'bike', lane.direction > 0, lane.left, lane.forward, lane.right);
            lane_list.append(l);
        }
        this._body.append(lane_list);
        this._body.append('<h2>Edit Road</h2><div class="spacer"></div>');
        this._body.append($('<button class="interface_button">Save Road</button>').data('road', road));
        this._body.append($('<button class="interface_button">Delete Road</button>').data('road', road));
        this._body.append('<h2>Connected Intersections</h2>');
        let intersections = r.getLinkedIntersections();
        if (!isEmpty(intersections.start)) {
            this._body.append($('<button class="interface_button">' + intersections.start.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
        if (!isEmpty(intersections.end)) {
            this._body.append($('<button class="interface_button">' + intersections.end.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
    }

    editIntersections() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Intersections</h2><div class="spacer"></div>');
        let intersections = this._map.getIntersections();
        for (let intersection in intersections) {
            this._body.append($('<button class="interface_button">' + intersection + '</button>').data('command', 'editIntersection'));
        }
    }

    editIntersection(intersection) {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Intersections</button>');
        this._body.append('<h2>Intersection: </h2><span>' + intersection + '</span>');
        this._body.append('<button class="small_button">Edit Name</button><div class="spacer"></div>');
        this._body.append('<h2>Edit Intersection</h2><div class="spacer"></div>');
        // this._body.append('<button class="interface_button">Save Road</button>');
        this._body.append($('<button class="interface_button">Delete Intersection</button>').data('intersection', intersection));
        this._body.append('<h2>Connected Roads</h2><div class="spacer"></div>');
        let roads = this._map.getIntersection(intersection).getLinkedRoads();
        console.log(roads);
        for (let i = 0; i < roads.length; i++) {
            this._body.append($('<button class="interface_button">' + roads[i].getId() + '</button>').data('command', 'editRoad'));
        }
    }

    loadSave() {
        let save;
        try {
            let cookie = getCookie('map');
            if (isEmpty(cookie)) {
                alert('No save found');
                throw new Error('No save found');
            }
            save = JSON.parse(decodeURIComponent(cookie));
        } catch (e) {
            alert('Error loading save');
            throw new Error('Error loading save');
        }
        this._map.load(save);
    }

    addRoad() {
        let mid = getSnappedMiddleOfScreen();
        let road = this._map.createRoad(mid.x - 50, mid.y, degToRad(270), mid.x + 50, mid.y, degToRad(90));
        road.setLanes([{
            type: 'car',
            direction: 1,
            left: true,
            forward: true,
            right: true
        }]);
        this.editRoad(road.getId());
    }

    addIntersection() {
        let mid = getSnappedMiddleOfScreen();
        let intersection = this._map.createIntersection(mid.x, mid.y);
        this.editIntersection(intersection.getId());
    }

    addLane() {
        let count = this._body.find('.lane').length;
        let html = this.generateLane(count);
        this._body.find('.lanes').append(html);
    }

    generateLane(count, bike = false, facing = true, left = true, forward = true, right = true) {
        let html = '<div class="lane"><div class="name">Lane <span>' + count + '</span></div>';
        html += '<div class="input">Bike Only <input type="checkbox" name="bike"' + (bike ? ' checked' : '') + '></div>';
        html += '<div class="input">Facing <input type="checkbox" name="facing"' + (facing ? ' checked' : '') + '></div>';
        html += '<button class="delete">Delete</button>';
        html += '<div class="input">Left <input type="checkbox" name="left"' + (left ? ' checked' : '') + '></div>';
        html += '<div class="input">Forward <input type="checkbox" name="forward"' + (forward ? ' checked' : '') + '></div>';
        html += '<div class="input">Right <input type="checkbox" name="right"' + (right ? ' checked' : '') + '></div>';
        html += '</div>';
        return html;
    }

    upload() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Upload</h2><div class="spacer"></div>');
        this._body.append('<input type="file" class="inputfile" accept=".map"><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Upload</button>');
    }

    uploadSave() {
        let files = document.getElementsByClassName('inputfile')[0].files;
        if (isEmpty(files)) {
            alert('No file selected');
            return;
        }
        let reader = new FileReader();
        reader.onload = function(e) {
            let save = JSON.parse(e.target.result);
            this._map.load(save);
            this.overview();
        }.bind(this);
        reader.readAsText(files[0]);
    }

    runCommand(command, data, target) {
        switch (command) {
            case 'Export for Simulation':
                alert('Not Implemented');
                break;
            case 'Import Save':
                this.upload();
                break;
            case 'Upload':
                this.uploadSave();
                break;
            case 'Load':
                this.loadSave();
                break;
            case 'Edit Roads':
                this.editRoads();
                break;
            case 'Edit Intersections':
                this.editIntersections();
                break;
            case 'Back to Menu':
                this.overview();
                break;
            case 'Back to Roads':
                this.editRoads();
                break;
            case 'Back to Intersections':
                this.editIntersections();
                break;
            case 'Add Road':
                this.addRoad();
                break;
            case 'Add Intersection':
                this.addIntersection();
                break;
            case 'Add Lane':
                this.addLane();
                break;
            case 'Delete':
                target.closest('.lane').remove();
                break;
            case 'Delete Road':
                this._map.removeRoad(data.road);
                this.editRoads();
                break;
            case 'Delete Intersection':
                this._map.removeIntersection(data.intersection);
                this.editIntersections();
                break;
            case 'Export as Save':
                downloadAsJson(this._map.exportSaveData());
                break;
            case 'Save':
                setCookie('map', encodeURIComponent(JSON.stringify(this._map.exportSaveData())), 14);
                break;
            case 'Save Road':
                let lanes = [];
                let lane;
                let lane_html = this._body.find('.lane');
                for (let i = 0; i < lane_html.length; i++) {
                    lane = $(lane_html[i]);
                    lanes.push({
                        type: lane.find('input[name="bike"]').is(':checked') ? 'bike' : 'car',
                        direction: lane.find('input[name="facing"]').is(':checked') ? 1 : -1,
                        left: lane.find('input[name="left"]').is(':checked'),
                        forward: lane.find('input[name="forward"]').is(':checked'),
                        right: lane.find('input[name="right"]').is(':checked')
                    });
                }
                let road = this._map.getRoad(data.road);
                road.setLanes(lanes);
                break;
            default:
                if (isEmpty(data.command)) {
                    throw new Error('Invalid Command');
                }
                switch (data.command) {
            case 'editRoad':
                this.editRoad(command);
                break;
            case 'editIntersection':
                this.editIntersection(command);
                break;
        }
        }
    }
}