<?php

namespace transit_webApp;

use Exception;

require_once '../services/DatabaseAccessLayer.php';

define('CONFIG_INI', '../services/config.ini');

/**
 * For testing the database setup and databaseAccessLayer
 */
function main() {
    if (php_sapi_name( ) !== 'cli')                         //only run from the command line
        die();

    testAll();
}

function testAll() {

    set_error_handler('\transit_webApp\warning_handler');   //manually handle warnings
    DatabaseAccessLayer::setTestMode(true);

    $testMethods = [
        function() { testDatabaseConnection(); },
        function() { testDatabaseTables(); },
        function() { testPreparedStatements(); }
    ];

    try {
        echo("=====begin database tests=====\n");
        foreach ($testMethods as $testMethod)
            $testMethod();
        echo("=====database tests PASSED=====\n");
    } catch (Exception $exception) {
        fail_test($exception);
    }
}

function fail_test(Exception $exception) {
    echo("\tFAILED\n");
    echo("\tException: " . $exception->getMessage() . "\n");
    echo("=====database tests FAILED=====\n");
    http_response_code(500);
    die();
}

function testDatabaseConnection() {
    echo("testing database connection...");
    DatabaseAccessLayer::getDatabaseConnection();
    echo("\tPASSED\n");
}

function testDatabaseTables() {
    $dbh = DatabaseAccessLayer::getDatabaseConnection();
    echo("testing existence of tables...\n");
    $tables = parse_ini_file(CONFIG_INI, true)['required_tables']['tables'];
    $useProxies = strtolower(parse_ini_file(CONFIG_INI, true)['general']['use_proxies']) == 'true';

    foreach ($tables as $table) {
        echo("   table \"$table\": ");
        if ($table == 'proxies' && !$useProxies) {
            echo("\t\tSKIPPED\n");
            continue;
        }

        $results = $dbh->query("SELECT * FROM $table;");

        if ($results === False)
            throw new Exception("Table missing: $table");
        else
            echo("\t\tEXISTS\n");
    }
}

/**
 * Test that the prepared statements exist
 */
function testPreparedStatements() {

    echo("testing prepared statements...\n");

    testProxySetup();

    echo("   testing GETROUTEID... ");
    try {
        DatabaseAccessLayer::convert_lineDirId(53210);
    } catch  (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\tPASSED\n");

    echo("   testing GETLINEDIRID...");
    try {
        DatabaseAccessLayer::convert_route_onestop_id('r-c2krpu-1');
    } catch  (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\tPASSED\n");

    echo("   testing UPDATEROUTEID...");
    DatabaseAccessLayer::updateRouteId("r-asdfgh-00", "12345", "00", "TESTING");
    $dbo = DatabaseAccessLayer::getDatabaseConnection();
    $dbo->query("DELETE FROM route_ids WHERE route_onestop_id='r-asdfgh-00';");
    echo("\tPASSED\n");
}

function testProxySetup(){
    $useProxies = parse_ini_file(CONFIG_INI, true)['general']['use_proxies'];
    if (strtolower($useProxies) === 'false') {
        echo("   proxy tests disabled; \tSKIPPED\n");
        return;
    }

    echo("   testing GETNUMBEROFPROXIES...");
    $numProxies = DatabaseAccessLayer::getNumberOfProxies();
    echo("$numProxies\n");
    if ($numProxies == 0)
        throw new Exception("Table \"proxies\" needs 2+ proxies to continue testing");

    echo("   testing GETPROXYBYID...");
    $proxy = DatabaseAccessLayer::getNextProxy();
    echo("\t$proxy\n");
}

/**
 * Convert warnings into exceptions
 */
function warning_handler(int $errno, string $errstr, string $errfile, int $errline) {
    throw new Exception("Error on line $errline of file $errfile:\n\t$errstr");
}

main();