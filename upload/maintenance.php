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
	$infobase->exec("DROP TABLE IF EXISTS customers_fts");
	$infobase->create_scheme();

	$infobase = new srv1c\infobase;
	$infobase->set_create_if_not_exists(false);
	$infobase->initialize();

	$infobase->exec( <<<'EOT'
		INSERT INTO products_fts
			SELECT
				p.uuid,
				p.code_fti AS code,
				p.name_fti AS name,
				p.article_fti AS article,
				p.description_fti AS description,
				b.barcode
			FROM
				products AS p
					LEFT JOIN barcodes_registry AS b
					ON p.uuid = b.product_uuid
EOT
	);

	$infobase->exec( <<<'EOT'
		INSERT INTO customers_fts
			SELECT
				p.uuid,
				p.name_fti AS name,
				p.inn AS inn,
				p.description_fti AS description
			FROM
				customers AS p
EOT
	);

    error_log("SQLITE FTS RECREATE, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));

	$tbls = [
		'products_fts'			=> <<<'EOT'
EOT
		,
		'customers_fts'			=> <<<'EOT'
EOT
	];

	foreach( $tbls as $tbl => $src )
		foreach( [ 'optimize', 'rebuild' ] as $cmd ) {

			$timer->restart();
			$infobase->exec("INSERT INTO ${tbl} (${tbl}) VALUES('${cmd}')");
		    error_log("SQLITE ${tbl} ${cmd}, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));

	}

	$tinfobase = get_trigger_infobase();

	$timer->restart();
	$infobase->exec('PRAGMA auto_vacuum = INCREMENTAL');
	$infobase->exec('VACUUM');
	$tinfobase->exec('PRAGMA auto_vacuum = INCREMENTAL');
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