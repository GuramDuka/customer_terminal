<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'infobase.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class maintenancer {

	protected $parameters_;

	public function set_parameters($parameters) {
		return $this->parameters_ = $parameters;
	}

	public function handler() {

		config::$sqlite_cache_size = 262144;
		config::$sqlite_temp_store = 'FILE';

		$infobase = new infobase;
		$infobase->set_create_if_not_exists(false);
		$infobase->initialize();

		$result = $infobase->query(<<<'EOT'
			SELECT
				name							AS name,
				value_type						AS value_type,
				COALESCE(value_uuid, value_s, value_b, value_n)	AS value
			FROM
				constants
			WHERE
				name IN ('@last_maintenance')
EOT
		);

		$last_maintenance = 0;

		while( $r = $result->fetchArray(SQLITE3_ASSOC) )
			$last_maintenance = $r['value'];

		//list($y, $m, $d) = explode('-', date('Y-m-d', time()));
		//$day_begin = mktime(0, 0, 0, $m, $d, $y);
		//$day_end = mktime(23, 59, 59, $m, $d, $y);
		$cur_day = intval(time() / 86400);
		$last_maintenance_day = intval($last_maintenance / 86400);

		if( $last_maintenance_day === $cur_day )
			return;

		extract($this->parameters_);

		if( @recreate_fts ) {

			$timer = new \nano_timer;

			$infobase->exec("DROP TABLE IF EXISTS products_fts");
			$infobase->exec("DROP TABLE IF EXISTS customers_fts");
			$infobase->create_scheme();

			$infobase = new infobase;
			$infobase->set_create_if_not_exists(false);
			$infobase->initialize();

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

			$infobase->exec(<<<'EOT'
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

    		error_log("SQLITE FTS TABLES RECREATED, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));
		}

		if( @incremental_vacuum ) {
			$timer = new \nano_timer;

			$infobase->exec('PRAGMA incremental_vacuum');

			config::$sqlite_cache_size = 4096;
			$tinfobase = get_trigger_infobase();
			$tinfobase->exec('DELETE FROM events WHERE timestamp <= ' . (time() - 86400));
			$tinfobase->exec('PRAGMA incremental_vacuum');

    		error_log("SQLITE INCREMENTAL VACUUMED, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));
		}

		$ct = time();

		$infobase->exec(<<<EOT
			REPLACE INTO constants (
				name, value_type, value_n
			) VALUES (
				'@last_maintenance', 2, ${ct}
			)
EOT
		);
	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
