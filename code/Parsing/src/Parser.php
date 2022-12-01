<?php

/**
 * class to read raw data from OSM and parse it
 */
class Parser
{
    private array $coordinates = array();
    private array $rawNodes = array();
    private array $rawStreets = array();
    private array $parsedNodes = array();
    private array $parsedStreets = array();
    private int $streetCount = 0;

    /**
     * constructor where coordinates for bounding box can be passed
     * @param float $lon1
     * @param float $lon2
     * @param float $lat1
     * @param float $lat2
     */
    public function __construct(float $lon1, float $lon2, float $lat1, float $lat2)
    {
        if ($lon1 > $lon2) {
            $temp = $lon1;
            $lon1 = $lon2;
            $lon2 = $temp;
        }

        if ($lat1 > $lat2) {
            $temp = $lat1;
            $lat1 = $lat2;
            $lat2 = $temp;
        }
        $this->coordinates = array("lon1" => $lon1, "lon2" => $lon2, "lat1" => $lat1, "lat2" => $lat2);
    }


    /**
     * main method bundling all important other methods
     * @return void
     */
    public function execute(): void {
        $this->readData();
        $this->parseNodes();
        $this->parseStreets();
        $this->writeJSON();
    }

    /**
     * read the raw input OSM data from overpass API
     * @return void
     */
    private function readData(): void {
        // overpass query
        $query = "http://overpass-api.de/api/interpreter?data=[out:json][bbox:" .  $this->coordinates["lat1"] . "," .  $this->coordinates["lon1"] . "," .  $this->coordinates["lat2"] . "," .  $this->coordinates["lon2"] . "];(way[highway=primary];way[highway=secondary];way[highway=trunk];way[highway=tertiary];way[highway=service];way[highway=residential];)->.a;(.a;>;);out;";
        // collecting results in JSON format
        $html = file_get_contents($query);
        $rawData = json_decode($html, true);

        //sorting the nodes and streets into two separate arrays
        foreach ($rawData["elements"] AS $element) {
            if ($element["type"] == "node") {
                $this->rawNodes[] = $element;
            } else if ($element["type"] == "way"){
                $this->rawStreets[] = $element;
            }
        }
    }

    /**
     * parse raw node data
     * @return void
     */
    private function parseNodes(): void {
        $nodeCounter = array();
        // counting how often each node is used, counting nodes at end of street twice to not accidentally delete these
        foreach ($this->rawStreets AS $streetData) {
            foreach ($streetData["nodes"] AS $id => $nodeId) {
                if ($id != 0 && $id != count($streetData["nodes"]) - 1) {
                    if (isset($nodeCounter[$nodeId])) {
                        $nodeCounter[$nodeId]++;
                    } else {
                        $nodeCounter[$nodeId] = 1;
                    }
                } else {
                    if (isset($nodeCounter[$nodeId])) {
                        $nodeCounter[$nodeId] += 2;
                    } else {
                        $nodeCounter[$nodeId] = 2;
                    }
                }
            }
        }

        // if node is only used once or not at all, delete it since it is unnecessary in the middle of a road
        foreach ($this->rawNodes AS $nodeData) {
            if (isset($nodeCounter[$nodeData["id"]]) && ($nodeCounter[$nodeData["id"]] > 1 || (isset($nodeData["tags"]["highway"]) && $nodeData["tags"]["highway"] == "traffic_signals"))) {
                $this->parsedNodes[$nodeData["id"]]["id"] = strval($nodeData["id"]);
                $this->parsedNodes[$nodeData["id"]]["coordinates"] = array("lon" => $nodeData["lon"], "lat" => $nodeData["lat"]);
                $this->parsedNodes[$nodeData["id"]]["roads"] = array();
                $this->parsedNodes[$nodeData["id"]]["trafficSignal"] = (isset($nodeData["tags"]["highway"]) && $nodeData["tags"]["highway"] == "traffic_signals");
                // roundabouts always set to false. As simplification it is seen as a road
                $this->parsedNodes[$nodeData["id"]]["roundabout"] = false;
            }
        }
    }

    /**
     * parse raw road data
     * @return void
     */
    private function parseStreets(): void {
        $splittedRoads = array();

        foreach ($this->rawStreets AS $arrayId => $streetData) {
            $osmId = $streetData["id"];
            $nodes = $streetData["nodes"];
            $segments = array();
            $segments[] = array("start" => $nodes[0]);
            $current = 0;

            if ($streetData["tags"]["highway"] == "traffic_signals") {
                print_r("yay");
            }
            // split roads at intersections
            for ($i = 1; $i < count($nodes); $i++) {
                if (isset($this->parsedNodes[$nodes[$i]])) {
                    $segments[$current]["end"] = $nodes[$i];
                    if ($i != count($nodes) - 1) {
                        $segments[++$current]["start"] = $nodes[$i];
                    }
                }
            }

            // go through segments and check the properties
            foreach ($segments AS $segment) {
                $startTrafficController = "NONE";
                $endTrafficController = "NONE";

                if($this->parsedNodes[$segment["start"]]["trafficSignal"]) {
                    $startTrafficController = "traffic_signal";
                }
                if($this->parsedNodes[$segment["end"]]["trafficSignal"]) {
                    $endTrafficController = "traffic_signal";
                }

                if (isset($streetData["tags"]["oneway"]) && $streetData["tags"]["oneway"] == "yes") {
                    $splittedRoads[$this->streetCount] = array("id" => strval($this->streetCount), "osmId" => $osmId, "arrayId" => $arrayId, "startNodeId" => $segment["start"], "endNodeId" => $segment["end"], "oppositeStreetId" => strval($this->streetCount + 1));
                    $splittedRoads[$this->streetCount + 1] = array("id" => strval($this->streetCount + 1), "osmId" => $osmId, "arrayId" => $arrayId, "startNodeId" => $segment["end"], "endNodeId" => $segment["start"], "oppositeStreetId" => strval($this->streetCount));
                    $this->parsedNodes[$segment["start"]]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => "outgoing");
                    $this->parsedNodes[$segment["end"]]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => $endTrafficController);
                    $this->parsedNodes[$segment["end"]]["roads"][] = array("id" => strval($this->streetCount + 1), "traffic_controller" => "outgoing");
                    $this->parsedNodes[$segment["start"]]["roads"][] = array("id" => strval($this->streetCount + 1), "traffic_controller" => $startTrafficController);
                    $this->streetCount += 2;
                } else {
                    $splittedRoads[$this->streetCount] = array("id" => strval($this->streetCount), "osmId" => $osmId, "arrayId" => $arrayId, "startNodeId" => $segment["start"], "endNodeId" => $segment["end"], "oppositeStreetId" => "-1");
                    $this->parsedNodes[$segment["start"]]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => "outgoing");
                    $this->parsedNodes[$segment["end"]]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => $endTrafficController);
                    $this->streetCount++;
                }
            }
        }

        // check how many lanes need to be made
        foreach ($splittedRoads AS $id => $data) {
            $coordinate1 = $this->parsedNodes[$data["startNodeId"]]["coordinates"];
            $coordinate2 = $this->parsedNodes[$data["endNodeId"]]["coordinates"];
            $length = round($this->distance($coordinate1["lon"], $coordinate1["lat"], $coordinate2["lon"], $coordinate2["lat"]));
            $rawData = $this->rawStreets[$data["arrayId"]];
            // standard speed of 50 km/h
            $maxSpeed = intval($rawData["tags"]["maxspeed"] ?? 50);

            if ($data["oppositeStreetId"] == "-1") {
                $lanes = $rawData["tags"]["lanes"] ?? 1;
            } else {
                if (isset($rawData["tags"]["lanes"])) {
                    if (isset($rawData["tags"]["lanes:forward"])) {
                        // if original direction or other direction
                        $lanes = ($data["oppositeStreetId"] > $id) ? $rawData["tags"]["lanes:forward"] : $rawData["tags"]["lanes"] - $rawData["tags"]["lanes:forward"];
                    } else {
                        $lanes = $rawData["tags"]["lanes"];
                    }
                } else {
                    $lanes = 1;
                }
            }

            $type = "both";
            if (isset($rawData["tags"]["bicycle"]) && $rawData["tags"]["bicycle"] == "no") {
                $type = "car";
            }

            $laneArray = array();

            // with these road types we assume they wide enough roads to always overtake so we add a seperate road for bicycles
            if (($rawData["tags"]["highway"] == "primary" || $rawData["tags"]["highway"] == "trunk" || $rawData["tags"]["highway"] == "secondary") && !(isset($rawData["tags"]["bicycle"]) && $rawData["tags"]["bicycle"] == "no")) {
                $this->parsedStreets[$this->streetCount + 1] = array("id" => strval($this->streetCount + 1), "intersections" => array("start" => array("id" => $data["startNodeId"]), "end" => array("id" => $data["endNodeId"])), "lanes" =>  array("type" => "bike", "left" => true, "forward" => true, "right" => true), "speed_limit" => $maxSpeed, "distance" => $length);
                $this->streetCount++;
                $type = "car";
            }

            // actually add the lanes
            for ($i = 0; $i < $lanes; $i++) {
                $laneArray[] = array("type" => $type, "left" => true, "forward" => true, "right" => true);
            }

            // if it is not a oneway node, add the ID of the opposite street
            if ($data["oppositeStreetId"] == "-1") {
                $this->parsedStreets[$id] = array("id" => $data["id"], "intersections" => array("start" => array("id" => $data["startNodeId"]), "end" => array("id" => $data["endNodeId"])), "lanes" => array_values($laneArray), "speed_limit" => $maxSpeed, "distance" => $length);
            } else {
                $this->parsedStreets[$id] = array("id" => $data["id"], "intersections" => array("start" => array("id" => $data["startNodeId"]), "end" => array("id" => $data["endNodeId"])), "lanes" => array_values($laneArray), "speed_limit" => $maxSpeed, "distance" => $length, "oppositeStreetId" => $data["oppositeStreetId"]);
            }
        }
    }

    /**
     * write the result JSON
     * @return void
     */
    private function writeJSON(): void {

        $handle = fopen("../data/mapExport.tsim", 'w+');
        fwrite($handle, json_encode(array("peripherals" => array("type" => "to-be-simulated", "date" => date("Y-m-d_H-i-s")), "intersections" => array_values($this->parsedNodes), "roads" => array_values($this->parsedStreets)), JSON_PRETTY_PRINT));
        fclose($handle);
    }

    /**
     * calculate the distance in meters between two pairs of earth coordinates
     * @param float $lon1
     * @param float $lat1
     * @param float $lon2
     * @param float $lat2
     * @return float
     */
    private function distance(float $lon1, float $lat1, float $lon2, float $lat2): float {
        // "haversine" formula from https://www.movable-type.co.uk/scripts/latlong.html (visited 28.11.2022)
        $radius = 6371e3;

        $phi1 = $lat1 * pi() / 180;
        $phi2 = $lat2 * pi() / 180;

        $deltaPhi = ($lat2 - $lat1) * pi() / 180;
        $deltaLambda = ($lon2 - $lon1) * pi() / 180;

        $a = pow(sin($deltaPhi / 2), 2) + cos($phi1) * cos($phi2) * pow(sin($deltaLambda/2), 2);
        $b = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radius * $b;
    }
}
