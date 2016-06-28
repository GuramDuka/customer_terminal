<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__ . DIRECTORY_SEPARATOR . '..') . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'loader.php';
//------------------------------------------------------------------------------
try {
	$handler = new srv1c\loader_handler;
	$handler->handle_json_request();
	$handler->print_json();
}
catch( Exception $e ) {
    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
