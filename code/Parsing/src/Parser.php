<?php

class Parser
{
    private array $rawNodes = array();
    private array $rawStreets = array();
    private array $parsedNodes = array();
    private array $parsedStreets = array();
    private array $agents = array();
    private int $streetCount = 0;

    public function execute(): void {
        $this->readData();
        $this->parseNodes();
        $this->parseStreets();
        $this->writeJSON();
    }

    private function readData(): void {
        $rawData = json_decode(file_get_contents("../data/importMapData.json"), true);

        foreach ($rawData["elements"] AS $element) {
            if ($element["type"] == "node") {
                $this->rawNodes[] = $element;
            } else if ($element["type"] == "way"){
                $this->rawStreets[] = $element;
            }
        }
    }

    private function parseNodes(): void {
        $nodeCounter = array();

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

        foreach ($this->rawNodes AS $nodeData) {
            if (isset($nodeCounter[$nodeData["id"]]) &&  $nodeCounter[$nodeData["id"]] > 1) {
                $this->parsedNodes[$nodeData["id"]]["id"] = $nodeData["id"];
                $this->parsedNodes[$nodeData["id"]]["coordinates"] = array("lon" => $nodeData["lon"], "lat" => $nodeData["lat"], "angle" => 0.0);
                $this->parsedNodes[$nodeData["id"]]["roads"] = array();
            }
        }
    }

    private function parseStreets(): void {
        $splittedRoads = array();

        foreach ($this->rawStreets AS $arrayId => $streetData) {
            $osmId = $streetData["id"];
            $nodes = $streetData["nodes"];
            $segments = array();
            $segments[] = array("start" => $nodes[0]);
            $current = 0;
            for ($i = 1; $i < count($nodes); $i++) {
                if (isset($this->parsedNodes[$nodes[$i]])) {
                    $segments[$current]["end"] = $nodes[$i];
                    if ($i != count($nodes) - 1) {
                        $segments[++$current]["start"] = $nodes[$i];
                    }
                }
            }

            $oneway = false;
            if (isset($streetData["tags"]["oneway"]) && $streetData["tags"]["oneway"] == "yes") {
                $oneway = true;
            }

            foreach ($segments AS $segment) {
                $splittedRoads[$this->streetCount] = array("id" => $this->streetCount, "osmId" => $osmId, "arrayId" => $arrayId, "startNodeId" => $segment["start"], "endNodeId" => $segment["end"], "oneway" => $oneway);
                $this->streetCount++;
            }
        }

        foreach ($splittedRoads AS $id => $data) {
            $coordinate1 = $this->parsedNodes[$data["startNodeId"]]["coordinates"];
            $coordinate2 = $this->parsedNodes[$data["endNodeId"]]["coordinates"];
            $length = round($this->distance($coordinate1["lon"], $coordinate1["lat"], $coordinate2["lon"], $coordinate2["lat"]));
            $rawData = $this->rawStreets[$data["arrayId"]];
            // standard speed of 50 km/h
            $maxSpeed = $rawData["tags"]["maxspeed"] ?? 50;

            if ($data["oneway"]) {
                $lanes = $rawData["tags"]["lanes"] ?? 1;
            } else {
                if (isset($rawData["tags"]["lanes"])) {
                    if (isset($rawData["tags"]["lanes:forward"])) {
                        $lanes = array($rawData["tags"]["lanes:forward"], $rawData["tags"]["lanes"] - $rawData["tags"]["lanes:forward"]);
                    } else {
                        $lanes = array($rawData["tags"]["lanes"], $rawData["tags"]["lanes"]);
                    }
                } else {
                    $lanes = array(1, 1);
                }
            }

            $type = "mixed";
            if (isset($rawData["tags"]["bicycle"]) && $rawData["tags"]["bicycle"] == "no") {
                $type = "car";
            }
            //ToDo: think about lanes
            $last = $rawData["nodes"][count($rawData["nodes"]) - 1] == $data["endNodeId"];
            $first = $rawData["nodes"][0] == $data["startNodeId"];
            $laneArray = array();
            if ($data["oneway"]) {
                if (!$last) {
                    for ($i = 0; $i < $lanes; $i++) {
                        $laneArray[] = array("type" => $type, "direction" => 1, "left" => false, "forward" => true, "right" => false);
                    }
                } else {
                    for ($i = 0; $i < $lanes; $i++) {
                        $laneArray[] = array("type" => $type, "direction" => 1, "left" => true, "forward" => true, "right" => true);
                    }
                }
            } else {
                if (!$last) {
                    for ($i = 0; $i < $lanes[0]; $i++) {
                        $laneArray[] = array("type" => $type, "direction" => 1, "left" => false, "forward" => true, "right" => false);
                    }
                } else {
                    for ($i = 0; $i < $lanes[0]; $i++) {
                        $laneArray[] = array("type" => $type, "direction" => 1, "left" => true, "forward" => true, "right" => true);
                    }
                }

                if (!$first) {
                    for ($i = 0; $i < $lanes[1]; $i++) {
                        $laneArray[] = array("type" => $type, "direction" => -1, "left" => false, "forward" => true, "right" => false);
                    }
                } else {
                    for ($i = 0; $i < $lanes[1]; $i++) {
                        $laneArray[] = array("type" => $type, "direction" => -1, "left" => true, "forward" => true, "right" => true);
                    }
                }
            }

            // with these road types we assume wide enough roads to always overtake so we add a seperate lane for bicycles
            if (($rawData["tags"]["highway"] == "primary" || $rawData["tags"]["highway"] == "trunk" || $rawData["tags"]["highway"] == "secondary") && !(isset($rawData["tags"]["bicycle"]) && $rawData["tags"]["bicycle"] == "no")) {
                //ToDo: check if just seperate lane is okay or seperate street
                if (!$last) {
                    $laneArray[] = array("type" => "bike", "direction" => 1, "left" => false, "forward" => true, "right" => false);
                } else {
                    $laneArray[] = array("type" => "bike", "direction" => 1, "left" => true, "forward" => true, "right" => true);
                }
                if (!$data["oneway"]) {
                    if (!$first) {
                        $laneArray[] = array("type" => "bike", "direction" => -1, "left" => false, "forward" => true, "right" => false);
                    } else {
                        $laneArray[] = array("type" => "bike", "direction" => -1, "left" => true, "forward" => true, "right" => true);
                    }
                }
                $this->streetCount++;
            }

            $this->parsedStreets[$id] = array("id" => $id, "intersections" => array("start" => $data["startNodeId"], "lanes" => array_values($laneArray), "end" => $data["endNodeId"]), "speed_limit" => $maxSpeed, "distance" => $length);
        }
    }

    private function writeJSON(): void {

        $handle = fopen("../data/export.json", 'w+');
        fwrite($handle, json_encode(array("agents" => $this->agents, "intersections" => $this->parsedNodes, "roads" => $this->parsedStreets), JSON_PRETTY_PRINT));
        fclose($handle);
    }

    //formula from https://www.movable-type.co.uk/scripts/latlong.html
    //calculates distance between two coordinate pairs
    private function distance(float $lon1, float $lat1, float $lon2, float $lat2): float {
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
