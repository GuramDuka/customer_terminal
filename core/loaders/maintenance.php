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
		$infobase->initialize();

		$result = $infobase->query(<<<'EOT'
			SELECT
				name							AS name,
				value_type						AS value_type,
				COALESCE(value_uuid, value_s, value_b, value_n)	AS value
			FROM
				constants
			WHERE
				name IN ('@last_maintenance', '@last_merge_fts')
EOT
		);

		$last_maintenance = 0;
		$last_merge_fts = 0;

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {
			extract($r);
			$name = mb_substr($name, 1);
			$$name = $value;
		}

		//list($y, $m, $d) = explode('-', date('Y-m-d', time()));
		//$day_begin = mktime(0, 0, 0, $m, $d, $y);
		//$day_end = mktime(23, 59, 59, $m, $d, $y);
		$ct = time();
		$cur_hour = intval($ct / 3600);
		$last_merge_fts = intval($last_merge_fts / 3600);
		$cur_day = intval($ct / 86400);
		$last_maintenance_day = intval($last_maintenance / 86400);

		extract($this->parameters_);

		if( @clean_fts && $last_maintenance_day !== $cur_day ) {

			$timer = new \nano_timer;

			/*$infobase->exec("DROP TABLE IF EXISTS products_fts");
			$infobase->exec("DROP TABLE IF EXISTS customers_fts");
			$infobase->create_scheme();

			$infobase = new infobase;
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
*/
			$infobase->exec(<<<'EOT'
				WITH ids AS ( 
					SELECT
						MAX(rowid) AS rowid, uuid, barcode
					FROM
						products_fts
					GROUP BY
       					uuid, barcode
				)
				DELETE FROM products_fts
				WHERE
					rowid NOT IN (SELECT rowid FROM ids);

				WITH ids AS ( 
					SELECT
						MAX(rowid) AS rowid, uuid
					FROM
						customers_fts
					GROUP BY
       					uuid
				)
				DELETE FROM customers_fts
				WHERE
					rowid NOT IN (SELECT rowid FROM ids)
EOT
			);

    		error_log("SQLITE FTS TABLES CLEANED, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));

		}

		if( @merge_fts && $last_merge_fts !== $cur_hour ) {

			foreach( [ 'products_fts', 'customers_fts' ] as $t ) {
				$timer = new \nano_timer;
				try {
					$infobase->exec("INSERT INTO ${t} (${t}, rank) VALUES('merge', 150)");
				}
				catch( \Throwable $e ) {

					$m = $e->getMessage();

					if( mb_strpos($m, 'SQL logic error') === false &&
						mb_strpos($m, 'no column named rank') === false )
						throw $e;

					$infobase->exec("INSERT INTO ${t} (${t}) VALUES('merge=8,150')");
				}
    			error_log("SQLITE FTS MERGE, ${t} ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));
			}

			$infobase->exec(<<<EOT
				REPLACE INTO constants (
					name, value_type, value_n
				) VALUES (
					'@last_merge_fts', 2, ${ct}
				)
EOT
			);

		}

		if( @incremental_vacuum && $last_maintenance_day !== $cur_day ) {
			$timer = new \nano_timer;

			$infobase->exec('PRAGMA incremental_vacuum');

			config::$sqlite_cache_size = 4096;
			$tinfobase = get_trigger_infobase();
			$tinfobase->exec('DELETE FROM events WHERE timestamp <= ' . ($ct - 86400));
			$tinfobase->exec('PRAGMA incremental_vacuum');

    		error_log("SQLITE INCREMENTAL VACUUMED, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));
		}

		if( (@clean_fts || @incremental_vacuum) && $last_maintenance_day !== $cur_day ) {
			$infobase->exec(<<<EOT
				REPLACE INTO constants (
					name, value_type, value_n
				) VALUES (
					'@last_maintenance', 2, ${ct}
				)
EOT
			);
		}
	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
