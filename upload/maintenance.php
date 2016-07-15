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
//------------------------------------------------------------------------------
try {

	$infobase = new srv1c\infobase;
	$infobase->set_create_if_not_exists(false);
	$infobase->initialize();

	foreach( [ 'products_fts', 'cars_fts', 'properties_values_fts' ] as $tbl )
		foreach( [ 'optimize'/*, 'rebuild', 'integrity-check'*/ ] as $cmd ) {

			$start_time = micro_time();
			$infobase->exec("INSERT INTO ${tbl} (${tbl}) VALUES('${cmd}')");
			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time);

		    error_log("SQLITE ${tbl} ${cmd}, ellapsed: " . ellapsed_time_string($ellapsed_ms));

	}

	$start_time = micro_time();
	$infobase->exec('VACUUM');
	$finish_time = micro_time();
	$ellapsed_ms = bcsub($finish_time, $start_time);

    error_log('SQLITE VACUUM, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	$start_time = micro_time();
	$infobase->exec('ANALYZE');
	$finish_time = micro_time();
	$ellapsed_ms = bcsub($finish_time, $start_time);

    error_log('SQLITE ANAYLYZE, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

}
catch( Throwable $e ) {
    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
