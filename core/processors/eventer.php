<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'infobase.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'handler.php';
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'events.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class eventer_handler extends handler {

	protected function handle_request() {

		$timer = new \nano_timer;

		$ellapsed = $timer->nano_time(false);

		extract($this->request_);

		if( @$get )
			$this->response_['events'] = get_events();
		if( @$received )
			confirm_receipt_events($received);

		//if( config::$log_timing )
		//	error_log('events retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
