<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__) . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
define('LOADERS_DIR', CORE_DIR . 'loaders' . DIRECTORY_SEPARATOR);
define('PROCESSORS_DIR', CORE_DIR . 'processors' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'handler.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class proxy_handler extends srv1c\handler {

	protected function handle_request() {

		$handler = null;

		try {

			if( config::$log_request )
				error_log(var_export($this->request_, true));

			$modules = [
				'pager' => [
					'pager'			=> true
				],
				'categorer' => [
					'categorer'		=> true
				],
				'producter' => [
					'producter'		=> true
				],
				'carter' => [
					'carter'		=> true
				],
				'selectorer' => [
					'selectorer'	=> true
				],
				'by_car_selectorer' => [
					'by_car_selectorer'	=> true
				],
				'eventer' => [
					'eventer'		=> true
				]
			];

			$module_name = @$this->request_['module'];
			$handler_name = @$this->request_['handler'];

			if( !array_key_exists($module_name, $modules) )
				throw new runtime_exception('Unknown module ' . $module_name, E_ERROR);

			if( !array_key_exists($handler_name, $modules[$module_name]) )
				throw new runtime_exception('Unknown handler ' . $handler_name, E_ERROR);

			if( !$modules[$module_name][$handler_name] )
				throw new runtime_exception('Handler ' . $handler_name . ' disabled', E_ERROR);

			require_once PROCESSORS_DIR . $module_name . '.php';

			$class_name = "srv1c\\${handler_name}_handler";

			$handler = new $class_name;
			$handler->request_ = $this->request_;
			$this->request_ = null;
			unset($handler->request_['module']);
			unset($handler->request_['handler']);

			$handler->response_ = $this->response_;
			$handler->handle_request();

			print($handler->get_json());

			if( config::$log_response )
				error_log(var_export($handler->response_, true));

	    }
		catch( Throwable $e ) {

		    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());

			if( $handler !== null )
				$this->response_ = $handler->response_;

			$this->response_['errno'] = $e->getCode() !== 0 ? $e->getCode() : E_ERROR;
			$this->response_['error'] = htmlspecialchars($e->getMessage(), ENT_HTML5);
			$this->response_['stacktrace'] = htmlspecialchars($e->getTraceAsString(), ENT_HTML5);

			print($this->get_json());

		}

	}

};
//------------------------------------------------------------------------------
$handler = new proxy_handler;
$handler->handle_json_request();
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
