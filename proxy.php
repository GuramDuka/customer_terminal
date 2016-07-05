<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__) . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
define('PROCESSORS_DIR', CORE_DIR . 'processors' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'handler.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class proxy_handler extends srv1c\handler {

	protected function handle_request() {

		$modules = [
			'pager' => [
				'pager'			=> true
			],
			'categorer' => [
				'categorer'		=> true
			],
			'producter' => [
				'producter'		=> true
			]
		];

		$module = @$this->request_->module;
		$handler = @$this->request_->handler;

		if( !array_key_exists($module, $modules) )
			throw new runtime_exception('Unknown module ' . $module, E_ERROR);

		if( !array_key_exists($handler, $modules[$module]) )
			throw new runtime_exception('Unknown handler ' . $handler, E_ERROR);

		if( !$modules[$module][$handler] )
			throw new runtime_exception('Handler ' . $handler . ' disabled', E_ERROR);

		require_once PROCESSORS_DIR . $module . '.php';

		$class_name = "srv1c\\${handler}_handler";

		$handler = new $class_name;
		$handler->handle_json_request();
		$handler->print_json();

    }

};
//------------------------------------------------------------------------------
try {
	$handler = new proxy_handler;
	$handler->handle_json_request();
}
catch( Throwable $e ) {
    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
