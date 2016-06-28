<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
mb_internal_encoding('UTF-8');
mb_regex_encoding('UTF-8');
mb_http_output('UTF-8');
date_default_timezone_set('Europe/Moscow');
//------------------------------------------------------------------------------
define('LOGS_DIR', APP_DIR . 'logs' . DIRECTORY_SEPARATOR);
define('LOG_FILE', LOGS_DIR . date('Y-m-d') . '.log');
//------------------------------------------------------------------------------
if( file_exists(dirname(LOG_FILE)) === false )
	mkdir(dirname(LOG_FILE), 0777, true);
//------------------------------------------------------------------------------
ini_set('error_log',				LOG_FILE);
ini_set('log_errors',				'On');
ini_set('display_errors',			'On');
ini_set('display_startup_errors',	'On');
error_reporting(E_ALL);// ^ E_NOTICE ^ E_WARNING);
require_once CORE_DIR . 'version.php';
//------------------------------------------------------------------------------
PHP_VERSION_ID < 70007 && die('PHP ' . PHP_VERSION . ' detected, required: 7.0.7');
//------------------------------------------------------------------------------
function e_handler($errno, $errstr, $errfile, $errline, array $errcontext) { 

	// error was suppressed with the @-operator
    if( 0 === error_reporting() )
        return false;

    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}
//------------------------------------------------------------------------------
set_error_handler('e_handler', E_ALL /*E_WARNING | E_NOTICE*/);
//------------------------------------------------------------------------------
define('LOADERS_DIR', CORE_DIR . 'loaders' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'config.php';
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
