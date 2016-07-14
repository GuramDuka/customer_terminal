<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once CORE_DIR . 'except.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
abstract class handler {

	protected $request_;
	protected $response_;

	abstract protected function handle_request();

	public function handle_json_request() {

		header('Content-Type: application/json; charset=utf-8');

		$this->response_ = [
			'errno' => JSON_ERROR_NONE,
		];

		$e = null;

		try {

			// detect cli mode
			if( php_sapi_name() === 'cli' || defined('STDIN') )
				$json = stream_get_contents(STDIN);
			else
				$json = file_get_contents('php://input');

			#file_put_contents('data.json', $json);

			\runtime_exception::throw_false($json);

			$this->request_ = json_decode($json, true, 512, JSON_BIGINT_AS_STRING);
			\invalid_json_exception::throw_json_error();

			// release memory
			if( config::$debug )
	        	error_log('Memory usage before: ' . memory_get_usage() . '. ' . __FILE__ . ', ' . __LINE__ . '. ' . __NAMESPACE__ . '::' . __FUNCTION__);

			$json = null;
			// let GC do the memory job
        	//time_nanosleep(0, 10000000);

			if( config::$debug )
        		error_log('Memory usage after: ' . memory_get_usage() . '. ' . __FILE__ . ', ' . __LINE__ . '. ' . __NAMESPACE__ . '::' . __FUNCTION__);

			$this->handle_request();

		    //error_log(var_export($_SERVER, true));
		    //error_log(var_export($_GET, true));
		    //error_log(var_export($_POST, true));
		    //error_log(var_export($_FILES, true));

		}
		catch( \Throwable $ex ) {

			$e = $ex;

			$this->response_['errno'] = $e->getCode() !== 0 ? $e->getCode() : E_ERROR;
			$this->response_['error'] = $e->getMessage();
			$this->response_['stacktrace'] = $e->getTraceAsString();

		}

		if( $e !== null )
			error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    }

	public function get_json() {

		return json_encode($this->response_, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT/* | JSON_HEX_QUOT | JSON_HEX_APOS*/);

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
