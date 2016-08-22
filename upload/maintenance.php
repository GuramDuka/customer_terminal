<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__ . DIRECTORY_SEPARATOR . '..') . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'infobase.php';
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'infobase.php';
//------------------------------------------------------------------------------
ini_set('max_execution_time', 600);
//------------------------------------------------------------------------------
try {

	$timer = new \nano_timer;

	config::$sqlite_cache_size = 262144;
	config::$sqlite_temp_store = 'FILE';

	$infobase = new srv1c\infobase;
	$infobase->set_create_if_not_exists(false);
	$infobase->initialize();

	foreach( [ 'products_fts', 'cars_fts', 'properties_values_fts' ] as $tbl )
		foreach( [ 'optimize'/*, 'rebuild', 'integrity-check'*/ ] as $cmd ) {

			$infobase->exec("INSERT INTO ${tbl} (${tbl}) VALUES('${cmd}')");
			$ellapsed = $timer->last_nano_time();

		    error_log("SQLITE ${tbl} ${cmd}, ellapsed: " . $timer->ellapsed_string($ellapsed));

	}

	$tinfobase = get_trigger_infobase();

	$timer->restart();
	$infobase->exec('VACUUM');
	$tinfobase->exec('VACUUM');
	$ellapsed = $timer->last_nano_time();

    error_log('SQLITE VACUUM, ellapsed: ' . $timer->ellapsed_string($ellapsed));

	$timer->restart();
	$infobase->exec('ANALYZE');
	$tinfobase->exec('ANALYZE');
	$ellapsed = $timer->last_nano_time();

    error_log('SQLITE ANAYLYZE, ellapsed: ' . $timer->ellapsed_string($ellapsed));

}
catch( Throwable $e ) {
    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
