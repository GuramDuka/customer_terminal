<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__ . DIRECTORY_SEPARATOR
	. '..' . DIRECTORY_SEPARATOR . '..') . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'infobase.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
$max_time = 25;
ini_set('max_execution_time', $max_time + 5);
ini_set('zlib.output_compression', 'Off');
ini_set('zend.enable_gc', 1);
$max_time *= 1000000;
$start = micro_time();
//------------------------------------------------------------------------------
try {

	$last_event_id = 0;

	if( function_exists('apache_request_headers') ) {

		$request_headers = apache_request_headers();

		if( array_key_exists('Last-Event-ID', $request_headers) )
			$last_event_id = intval($request_headers['Last-Event-ID']);

	}

	ob_implicit_flush(true);
	ob_end_flush();

	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');
	header('Connection: keep-alive');

	/*$counter = rand(1, 10);
	$infobase = null;

	while( true ) {

		if( $infobase === null ) {

			$infobase = new srv1c\infobase;
			$infobase->initialize();

		}

		// Every second, sent a "ping" event.
  
		echo "retry: 3000\n";
		$curDate = date(DATE_ISO8601);
		echo 'data: {"time": "' . $curDate . '"}' . "\n";
		echo 'id: ' . (++$last_event_id) . "\n";
		echo "\n\n";
  
		// Send a simple message at random intervals.
  
		$counter--;
  
		if( !$counter ) {
			echo "retry: 3000\n";
			echo 'data: This is a message at time ' . $curDate . "\n";
			echo 'id: ' . (++$last_event_id) . "\n";
			echo "\n\n";
			$counter = rand(1, 10);
		}
  
		ob_flush();
		flush();
		sleep(1);

	}*/

	/*$context = null;
	$responder = null;

	while( micro_time() - $start < $max_time ) {

		$context = new ZMQContext(1, false);

		//  Socket to talk to clients
		$responder = new ZMQSocket($context, ZMQ::SOCKET_REP, 'server', function (ZMQSocket $socket, $persistent_id = null) {

	    	if( $persistent_id === 'server' ) {
        		$socket->bind(config::$zmq_socket, true);
    		}
			else {
        		//$socket->connect("tcp://localhost:12122");
			}

		});

		try {

			$responder->bind(config::$zmq_socket, false);
			break;

		}
		catch( ZMQSocketException $e ) {

			if( $e->getCode() !== 100 ) // Failed to bind the ZMQ: Address in use
				throw $e;

			$responder = null;
			$context = null;

		    //error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
			//time_nanosleep(0, 100000000); // 100ms
			time_nanosleep(1, 0); // 1s

		}

	}

	//error_log('sse handler started');

	$read = $write = [];*/

	config::$sqlite_cache_size = 4096;
	$infobase = get_trigger_infobase();

	$st = $infobase->prepare(<<<'EOT'
		SELECT
			rowid,
			timestamp,
			event
		FROM
			events
		WHERE
			ready = 1
			AND sent IS NULL
		ORDER BY
			timestamp,
			rowid
EOT
	);

	$rowid = null;

	$st_upd = $infobase->prepare('UPDATE events SET sent = 1 WHERE rowid = :rowid');
	$st_upd->bindParam(':rowid', $rowid);

	$st_del = $infobase->prepare('DELETE FROM events WHERE rowid = :rowid');
	$st_del->bindParam(':rowid', $rowid);

	while( micro_time() - $start < $max_time ) {

    	//  Wait for next request from client
		/*$poll = new ZMQPoll();
        $poll->add($responder, ZMQ::POLL_IN | ZMQ::POLL_OUT);

        $events = $poll->poll($read, $write, 1000);

		if( $events === 0 ) {

			echo "retry: 100\n";
			$curDate = date(DATE_ISO8601);
			echo 'data: {"time": "' . $curDate . '"}' . "\n";
			echo 'id: ' . (++$last_event_id) . "\n";
			echo "\n\n";

		}

        foreach( $read as $r ) {

	    	$request = $r->recv();

		    //$request = $responder->recv();
    		//printf ("Received request: [%s]\n", $request);

			if( substr($request, -1, 1) !== "\n" )
				$request .= "\n";

			echo "retry: 100\n";
			echo 'data: ' . $request . "\n";
			echo 'id: ' . (++$last_event_id) . "\n";
			echo "\n\n";

	    	//  Send reply back to client
	    	$responder->send('received');

		}*/

		// Optional: kill all other output buffering
		while( ob_get_level() > 0 )
		    ob_end_clean();

		$infobase->exec('BEGIN /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

		$result = $st->execute();

		while( ($record = $result->fetchArray(SQLITE3_ASSOC)) && micro_time() - $start < $max_time ) {

			extract($record);

			$event = str_replace("\n", '', $event);
			$event = str_replace("\r", '', $event);

			//error_log("${rowid}, ${timestamp}, ${event}");

			++$last_event_id;

			echo "retry: 100\ndata: ${event}\nid: ${last_event_id}\n\n";

			//ob_flush();
			//flush();

			$st_upd->execute();
			//$st_del->execute();

		}

		//if( $all_records_processed )
		//	$st_e->execute();

		//echo "retry: 100\n";
		//echo 'data: {"timestamp": "' . date(DATE_ISO8601) . '"}' . "\n";
		//echo 'id: ' . (++$last_event_id) . "\n";
		//echo "\n\n";

		$infobase->exec('COMMIT TRANSACTION');

		time_nanosleep(1, 0); // 1s

	}

}
catch( Throwable $e ) {

    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());

}

//error_log('sse handler stoped');
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
