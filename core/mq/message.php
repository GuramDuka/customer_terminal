<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__ . DIRECTORY_SEPARATOR
	. '..' . DIRECTORY_SEPARATOR . '..') . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'infobase.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
try {

	$start_time = micro_time();

	$infobase = null;

	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');
	header('Connection: keep-alive');

	$counter = rand(1, 10);

	while( true ) {

		if( $infobase === null ) {

			$infobase = new srv1c\infobase;
			$infobase->set_create_if_not_exists(false);
			$infobase->initialize();

		}

		// Every second, sent a "ping" event.
  
		echo "event: ping\n";
		$curDate = date(DATE_ISO8601);
		echo 'data: {"time": "' . $curDate . '"}';
		echo "\n\n";
  
		// Send a simple message at random intervals.
  
		$counter--;
  
		if( !$counter ) {
			echo 'data: This is a message at time ' . $curDate . "\n\n";
			$counter = rand(1, 10);
		}
  
		ob_flush();
		flush();
		sleep(1);

	}

}
catch( Throwable $e ) {
    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
