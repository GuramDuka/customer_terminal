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

	public function event($data /* json string */) {

		$this->events_[] = $data;

	}

	public function fire() {

		config::$sqlite_cache_size = 4096;
		$infobase = get_trigger_infobase();

		$infobase->exec('BEGIN IMMEDIATE /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

		$timestamp = $event = null;
		$st = $infobase->prepare('INSERT INTO events (timestamp, ready, event) VALUES (:timestamp, 0, :event)');
		$st->bindParam(':timestamp'	, $timestamp);
		$st->bindParam(':event'		, $event);

		//ob_start();
		//debug_print_backtrace();
		//$trace = ob_get_contents();
		//ob_end_clean();

		//error_log(var_export($this->events_, true) . "\n" . $trace);

		foreach( $this->events_ as $event ) {

			$timestamp = time();
			$st->execute();

		}

		$infobase->exec('COMMIT TRANSACTION');

	}

	public function push() {

		$infobase = get_trigger_infobase();

		$infobase->exec('BEGIN IMMEDIATE /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

		$infobase->exec('UPDATE events SET ready = 1 WHERE NOT ready');

		$infobase->exec('COMMIT TRANSACTION');

	}

}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
