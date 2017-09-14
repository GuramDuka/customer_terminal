<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'infobase.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class events_trigger {

	protected $events_ = [];

	public function __construct() {
	}

	public function event($data) {

		$this->events_[] = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);

	}

	public function fire() {

		config::$sqlite_cache_size = 4096;
		$infobase = get_trigger_infobase();

		//ob_start();
		//debug_print_backtrace();
		//$trace = ob_get_contents();
		//ob_end_clean();

		//error_log(var_export($this->events_, true) . "\n" . $trace);

		$infobase->exec('BEGIN /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

		$timestamp = null;
		$st = $infobase->prepare('INSERT INTO events (timestamp, ready, sent, event) VALUES (:timestamp, NULL, NULL, :event)');
		$st->bindParam(':timestamp'	, $timestamp);

		foreach( $this->events_ as $event ) {

			$timestamp = time();
			$st->bindValue(':event', $event);
			$st->execute();

		}

		$infobase->exec('COMMIT TRANSACTION');

	}

	public function push() {

		$timer = new \nano_timer;

		$infobase = get_trigger_infobase();

		$infobase->exec('BEGIN /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');
		$infobase->exec('UPDATE events SET ready = 1 WHERE ready IS NULL');
		$infobase->exec('COMMIT TRANSACTION');

		[ $ellapsed ] = $timer->nano_time();

	    error_log('events pushed, ellapsed: ' . $timer->ellapsed_string($ellapsed));

	}

}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
