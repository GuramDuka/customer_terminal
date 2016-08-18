<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'utils.php';
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

		$infobase = new SQLite3(APP_DIR . 'data' . DIRECTORY_SEPARATOR . 'events.sqlite');
		$infobase->busyTimeout(180000);	// 180 seconds
		$infobase->enableExceptions(true);
		$infobase->exec('PRAGMA page_size = 4096');
		$infobase->exec('PRAGMA journal_mode = WAL');
		$infobase->exec('PRAGMA count_changes = OFF');
		$infobase->exec('PRAGMA auto_vacuum = NONE');
		$infobase->exec('PRAGMA cache_size = -8192');
		$infobase->exec('PRAGMA synchronous = NORMAL');
		$infobase->exec('PRAGMA temp_store = MEMORY');

		$infobase->exec('BEGIN /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

		$infobase->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS events (
				timestamp	INTEGER,
				event		TEXT
			) /*WITHOUT ROWID*/
EOT
		);

		$index_name = 'i' . substr(hash('haval256,3', 'events_by_timestamp'), -4);

		$infobase->exec(<<<EOT
			CREATE INDEX IF NOT EXISTS ${index_name} ON events (timestamp)
EOT
		);

		$timestamp = $event = null;
		$st = $infobase->prepare('INSERT INTO events (timestamp, event) VALUES (:timestamp, :event)');
		$st->bindParam(':timestamp'	, $timestamp);
		$st->bindParam(':event'		, $event);

		foreach( $this->events_ as $event ) {

			$timestamp = time();
			$st->execute();

		}

		$infobase->exec('COMMIT TRANSACTION');

	}

}

/*

		$read = $write = [];

		try {

			$context = new \ZMQContext();
			//  Socket to talk to server
			$requester = new \ZMQSocket($context, \ZMQ::SOCKET_REQ);
			$requester->connect(config::$zmq_socket);

	    	//  Wait for next request from client
			$poll = new \ZMQPoll();
        	$poll->add($requester, \ZMQ::POLL_IN | \ZMQ::POLL_OUT);

	        //$events = $poll->poll($read, $write, 1000);

			//error_log(var_export($read, true) . "\n" . var_export($write, true));

    		$requester->send(json_encode($msg, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

	        $events = $poll->poll($read, $write, 1000);
			error_log(var_export($read, true) . "\n" . var_export($write, true));

	        foreach( $read as $r ) {

			   	$reply = $r->recv();

				if( $reply !== 'received' )
    				throw new \ErrorException('Invalid reply', 1);

			}

		}
		catch( \Throwable $e ) {

    		error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . __LINE__);
			throw $e;

		}
		catch( \ZMQSocketException $e ) {

    		error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . __LINE__);
			throw $e;

		}*/
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
