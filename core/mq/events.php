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
function get_events() {

	$infobase = get_trigger_infobase();

	$st = $infobase->prepare(<<<'EOT'
		SELECT
			rowid,
			timestamp,
			event
		FROM
			events
		WHERE
			ready
		ORDER BY
			timestamp,
			rowid
EOT
	);

	$rowid = null;

	$infobase->exec('BEGIN IMMEDIATE /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

	$result = $st->execute();
	$events = [];

	while( $record = $result->fetchArray(SQLITE3_ASSOC) ) {

		extract($record);

		$e = json_decode($event, true, 512, JSON_BIGINT_AS_STRING);
		$e['id'] = $rowid;
		$events[] = $e;

	}

	$infobase->exec('COMMIT TRANSACTION');

	return $events;

}
//------------------------------------------------------------------------------
function confirm_receipt_events($events_ids) {

	$infobase = get_trigger_infobase();

	$rowid = null;

	$st_del = $infobase->prepare('DELETE FROM events WHERE rowid = :rowid');
	$st_del->bindParam(':rowid', $rowid);

	$infobase->exec('BEGIN IMMEDIATE /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION');

	foreach( $events_ids as $rowid )
		$st_del->execute();

	$infobase->exec('COMMIT TRANSACTION');

}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
