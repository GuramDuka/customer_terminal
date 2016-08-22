<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'utils.php';
//------------------------------------------------------------------------------
function get_trigger_infobase() {

	$infobase = new SQLite3(APP_DIR . 'data' . DIRECTORY_SEPARATOR . 'events.sqlite');
	$infobase->busyTimeout(180000);	// 180 seconds
	$infobase->enableExceptions(true);

	$pgsz = config::$sqlite_page_size;
	$infobase->exec("PRAGMA page_size = ${pgsz}");

	$infobase->exec('PRAGMA journal_mode = WAL');
	$infobase->exec('PRAGMA count_changes = OFF');
	$infobase->exec('PRAGMA auto_vacuum = NONE');

	$cachesz = config::$sqlite_cache_size;
	$infobase->exec("PRAGMA cache_size = -${cachesz}");

	$infobase->exec('PRAGMA synchronous = NORMAL');

	$temp_store = config::$sqlite_temp_store;
	$infobase->exec("PRAGMA temp_store = ${temp_store}");

	$infobase->exec(<<<'EOT'
		CREATE TABLE IF NOT EXISTS events (
			timestamp	INTEGER,
			ready		INTEGER,
			event		TEXT
		) /*WITHOUT ROWID*/
EOT
	);

	$index_name = 'i' . substr(hash('haval256,3', 'events_by_ready'), -4);

	$infobase->exec(<<<EOT
		CREATE INDEX IF NOT EXISTS ${index_name} ON events (ready)
EOT
	);

	return $infobase;

}
//------------------------------------------------------------------------------
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
