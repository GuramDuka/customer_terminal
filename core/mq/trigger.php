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
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
try {

	$start_time = micro_time();

    $pipe = APP_DIR .'mq-' . $mq_channel;
    $pipe_handle = fopen($pipe, 'c+b');

	runtime_exception::throw_false($pipe_handle);

    if( $pipe_handle === false ){

      mkdir(dirname($pipe), 0755, true);
      $pipe_handle = fopen($pipe, 'c+b');

    }

    if( flock($pipe_handle, LOCK_EX | ($record[1] > 0 ? LOCK_NB : 0)) ){
      fseek($handle,0);
        ftruncate($handle,0);

		$mq_subscribers = [
		];

	    $subscriber_pipe = APP_DIR .'mq-' . $mq_channel . '-' . $subscriber;
    	$subscriber_pipe_handle = fopen($subscriber_pipe, 'c+b');

		if (!flock($fp, LOCK_EX | LOCK_NB, $wouldblock)) {
                if ($wouldblock) {
                    //Another process holds the lock!
              
                } else {
                    //Couldn't lock for another reason, e.g. no such file
            
                }
            } else {
                //Lock obtained

                startJob();
            }

      flock($pipe_handle, LOCK_UN);
      fclose($pipe_handle);
	}

}
catch( Throwable $e ) {

    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    header(':', true, 500);

}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
