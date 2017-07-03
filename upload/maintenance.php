<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
define('APP_DIR', realpath(__DIR__ . DIRECTORY_SEPARATOR . '..') . DIRECTORY_SEPARATOR);
define('CORE_DIR', APP_DIR . 'core' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once CORE_DIR . 'startup.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'infobase.php';
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'infobase.php';
//------------------------------------------------------------------------------
try {

	$timer = new \nano_timer;

	config::$sqlite_cache_size = 262144;
	config::$sqlite_temp_store = 'FILE';

	$infobase = new srv1c\infobase;
	$infobase->set_create_if_not_exists(false);
	$infobase->initialize();

	$infobase->exec("DROP TABLE IF EXISTS products_fts");
	$infobase->create_scheme();

	$infobase = new srv1c\infobase;
	$infobase->set_create_if_not_exists(false);
	$infobase->initialize();

	$infobase->exec( <<<'EOT'
		INSERT INTO products_fts(rowid, uuid, code, name, article, description)
			SELECT
				rowid,
				uuid,
				code,
				name,
				article,
				description
			FROM
				products
EOT
	);

    error_log("SQLITE FTS REBUILD, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));

	$tbls = [
		'products_fts'			=> <<<'EOT'
EOT
	];

	foreach( $tbls as $tbl => $src )
		foreach( [ 'optimize' ] as $cmd ) {

			$timer->restart();
			$infobase->exec("INSERT INTO ${tbl} (${tbl}) VALUES('${cmd}')");
		    error_log("SQLITE ${tbl} ${cmd}, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));

	}

	/*$sql = <<<EOT
		SELECT DISTINCT
			uuid, code, name
		FROM
			products_fts
		WHERE
			products_fts MATCH 'ATR65*'
EOT
	;
	$st = $infobase->prepare($sql);
	$result = $st->execute();
	while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {
		extract($r);

		$p[] = [
			'uuid'		=> bin2uuid($uuid),
			'code'		=> $code,
			'name'		=> htmlspecialchars($name, ENT_HTML5)
		];

    	error_log(var_export($p));
	}*/

	$tinfobase = get_trigger_infobase();

	$timer->restart();
	$infobase->exec('VACUUM');
	$tinfobase->exec('VACUUM');
    error_log('SQLITE VACUUM, ellapsed: ' . $timer->ellapsed_string($timer->last_nano_time()));

	$timer->restart();
	$infobase->exec('ANALYZE');
	$tinfobase->exec('ANALYZE');
    error_log('SQLITE ANAYLYZE, ellapsed: ' . $timer->ellapsed_string($timer->last_nano_time()));

}
catch( Throwable $e ) {
    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>