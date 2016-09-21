<?php

namespace transit_webApp;

require_once 'DatabaseAccessLayer.php';

define('CONFIG_INI', 'config.ini');

class TransitManager {

    //region higher level functions

    static function getBusData(string $route_onestop_id) : string {
        $results = self::getLineDirIdsFromRouteOnestopId($route_onestop_id);
        $busCoords = [];

        //request and format data for each direction
        foreach ($results as $direction) {
            $request = self::buildTravelPointsRequest($direction['lineDirId']);
            $responseJson = self::requestRealTimeManagerData($request);
            $lineDirCoords = self::buildBusDataFromResult($direction['dirName'], $responseJson);
            array_push($busCoords, $lineDirCoords);
        }
        $json = self::formatArrayToJsonObject($busCoords);

        header('Content-Type: application/json');
        return $json;
    }

    static function getRouteGeometry(string $route_onestop_id) : string {
        $results = self::getLineDirIdsFromRouteOnestopId($route_onestop_id);
        $routeLines = [];

        //request and format data for each direction
        foreach ($results as $direction) {
            $request = self::buildLineTraceRequest($direction['lineDirId']);
            $responseJson = self::requestInfoWebData($request);
            $geometry = self::buildGeometryFromResult($direction['dirName'], $responseJson);
            array_push($routeLines, $geometry);
        }
        $json = self::formatArrayToJsonObject($routeLines);

        header('Content-Type: application/json');
        return $json;
    }

    //endregion

    //region STA request functions

    static function requestRealTimeManagerData(string $request) : string {
        return self::makeSTARequestWithResource($request, 'RealTimeManager');
    }

    static function requestInfoWebData(string $request) : string {
        return self::makeSTARequestWithResource($request, 'InfoWeb');
    }

    private static function makeSTARequestWithResource(string $request, string $resource) : string {
        $use_proxy = strtolower(parse_ini_file(CONFIG_INI, true)['general']['use_proxies']) == 'true';
        if ($use_proxy)
            return self::makeRequestThroughProxy($request, $resource);
        else
            return self::makeSTArequest($request, $resource);
    }

    private static function makeRequestThroughProxy(string $request, string $resource) : string {
        $proxy = "";
        do {
            $proxy = DatabaseAccessLayer::getNextProxy($proxy);
            $response = self::makeSTArequest($request, $resource, $proxy);
        } while (empty($response) || $response['statusCode'] != 200);

        return $response;
    }

    private static function makeSTArequest(string $request, string $subdir, string $IPv4_Proxy = "") : string {

        $requestHeaders = ['Content-Type: application/json',
            'Host: tripplanner.spokanetransit.com:8007',
            'Origin: http://tripplanner.spokanetransit.com:8007',
            'Referer: http://tripplanner.spokanetransit.com:8007/'];

        $ch = curl_init("http://tripplanner.spokanetransit.com:8007/$subdir");
        if (!empty($IPv4_Proxy)) {
            curl_setopt($ch, CURLOPT_PROXY, $IPv4_Proxy);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
        }
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        //curl_setopt($ch, CURLOPT_VERBOSE, 1);
        curl_setopt($ch, CURLOPT_HEADER, 1);

        $response = curl_exec($ch);
        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        //$headers = substr($response, 0, $header_size);
        $body = substr($response, $header_size);

        return $body;
    }

    //endregion

    //region STA request helpers

    private static function getLineDirIdsFromRouteOnestopId($route_onestop_id) : array {
        try {
            $lineDirIds = DatabaseAccessLayer::convert_route_onestop_id($route_onestop_id);
        } catch (NoResultsException $exception) {
            $lineDirIds = [];
            //TODO: log to file
        }
        return $lineDirIds;
    }

    private static function buildTravelPointsRequest(string $lineDirId) : string {
        return '{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"lineDirId":"' . $lineDirId . '","callingApp":"RMD"}],"interval":10}}';
    }

    private static function buildLineTraceRequest(string $lineDirId) : string {
        return '{"version":"1.1","method":"GetLineTrace","params":{"GetLineTraceRequest":{"LineDirId":' . $lineDirId . '}}}';
    }

    private static function buildBusDataFromResult(string $dirName, string $json) : string {
        $busData = json_decode($json, true);
        $locations = $busData["result"]["travelPoints"];
        $busLocations = [];

        foreach ($locations as $location){
            $lat = $location['Lat'];
            $lng = $location['Lon'];
            $heading = $location['Heading'];
            array_push($busLocations, json_decode("{\"lat\": $lat, \"lng\": $lng, \"heading\":$heading}"));
        }

        $busLocations = json_encode($busLocations);
        $returnJson = "\"$dirName\":$busLocations";
        return $returnJson;
    }

    private static function formatArrayToJsonObject(array $array) : string {
        $json = "{";
        for ($i = 0; $i < count($array); $i++){
            $json .= $array[$i];
            if ($i < count($array)-1)
                $json .= ',';
        }
        $json .= '}';
        return $json;
    }

    private static function buildGeometryFromResult(string $dirName, string $json) : string {
        $lineData = json_decode($json, true)['result'][0]['GoogleMap'];
        $points = [];
        foreach ($lineData as $segment)
            array_push($points, $segment['Points']);
        $lineData[0]['Points'] = $points;
        $lineData = $lineData[0];
        $lineData = json_encode($lineData);
        $lineData = str_replace("Lat", "lat", $lineData);
        $lineData = str_replace("Lon", "lng", $lineData);
        $returnJson = "\"$dirName\":$lineData";
        return $returnJson;
    }

    //endregion


    public static function makeTransitLandRequest(string $endpoint) : string {
        $transitLandUrl = "https://transit.land/api/v1/$endpoint";
        $ch = curl_init($transitLandUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        //curl_setopt($ch, CURLOPT_VERBOSE, 1);

        $response = curl_exec($ch);
        curl_close($ch);

        return $response;
    }

    private static function validateMethod($method){
        $acceptableMethods = ['getBusData', 'getRouteGeometry'];
        if (!in_array($method, $acceptableMethods, true)) {
            http_response_code(400);
            die();
        }
    }

    /**
     * Post body example: {"method":"getBusLocations","params":"r-12354-00"}
     * @return string
     */
    static function processRequest() : string {
        $post = json_decode(file_get_contents('php://input'), true);
        if ($post == null)
            return "";

        $method = $post['method'];
        self::validateMethod($method);
        $method = 'self::' . $method;

        $params = $post['params'];
        $response = call_user_func($method, $params);

        return $response;
    }
}

print(TransitManager::processRequest());
