<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
function rewrite_pages($infobase) {

	$pgsz = config::$page_size;

	$all_fields = [ 'uuid', 'code', 'name', 'base_image_uuid', 'base_image_ext', 'price', 'remainder', 'reserve' ];

	$fields = [];
	$fields_uuid = [];
	$fields_extractor = [ 'pgnon' => null ];

	foreach( $all_fields as $field ) {

		if( substr($field, -4) === 'uuid' )
			$fields_uuid[] = $field;
		else
			$fields[] = $field;

		$fields_extractor[$field] = null;

	}

	$pgupd = 0;

	$infobase->begin_transaction();

	list($orders, $directions) = get_orders_directions();

	$timer = new \nano_timer;
	$tx_timer = new \nano_timer;

	$r = $infobase->query('SELECT entity FROM dirties WHERE entity = \'products_pages\'');

	if( $r->fetchArray(SQLITE3_NUM) || config::$force_rewrite_pages ) {

		// create temp tables

		$create_products_table = function ($prefix) use ($infobase) {

			$infobase->exec(<<<EOT
				CREATE TEMP TABLE IF NOT EXISTS ${prefix}products (
					uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
					code       		INTEGER,
					name       		TEXT,
					base_image_uuid	BLOB,
					quantity		NUMERIC,
					price			NUMERIC
				)
EOT
			);

		};

		$create_products_table('rpf_');

		$timer->restart();

		// fetch only not empty name and have image, price, quantity
		$sql = <<<'EOT'
			INSERT INTO rpf_products
			SELECT 
				q.product_uuid AS uuid,
				a.code,
				a.name,
				a.base_image_uuid,
				q.quantity,
				p.price
			FROM
				remainders_registry AS q
				INNER JOIN prices_registry AS p
				ON q.product_uuid = p.product_uuid
                		AND q.quantity > 0
				INNER JOIN products AS a
				ON q.product_uuid = a.uuid
					/*AND a.base_image_uuid IS NOT NULL*/
			WHERE
				p.price > 0
				AND a.code > 0
				AND a.name > ''
EOT
		;

		$infobase->dump_plan($sql);
		$infobase->exec($sql);

		if( config::$rewrite_pages_timing ) {

			$ellapsed = $timer->last_nano_time();
	    	error_log('rpf_products updated, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		// fetch all categories
		$sql = <<<'EOT'
			SELECT
				NULL
			UNION ALL
			SELECT
				uuid
			FROM
				categories
			WHERE
				display
					AND selection
EOT
		;

		$infobase->dump_plan($sql);

		$result = $infobase->query($sql);

		$categories = [];

		while( $r = $result->fetchArray(SQLITE3_NUM) )
			$categories[] = $r[0];

		foreach( $categories as $category_uuid ) {

			$prefix = 'rpf';
			$category_name = uuid2table_name(bin2uuid($category_uuid));
			$prefix .= '_' . $category_name;

			// fetch categories hierarchy
			if( $category_uuid !== null ) {

				$timer->restart();

				$infobase->exec(<<<EOT
					CREATE TEMP TABLE IF NOT EXISTS ${prefix}categories (
	    			   uuid BLOB PRIMARY KEY ON CONFLICT REPLACE
					)
EOT
				);

				$sql = <<<EOT
				WITH
					cte0 AS (SELECT uuid FROM categories WHERE uuid = :category_uuid),
					cte1 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte0)),
					cte2 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte1)),
					cte3 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte2)),
					cte4 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte3)),
					cte5 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte4))
	
					INSERT INTO ${prefix}categories
					SELECT uuid FROM cte0
					UNION ALL
					SELECT uuid FROM cte1
					UNION ALL
					SELECT uuid FROM cte2
					UNION ALL
					SELECT uuid FROM cte3
					UNION ALL
					SELECT uuid FROM cte4
					UNION ALL
					SELECT uuid FROM cte5
EOT
				;

				$infobase->dump_plan($sql);
				$st = $infobase->prepare($sql);
				$st->bindParam(":category_uuid", $category_uuid, SQLITE3_BLOB);
				$st->execute();

				if( config::$rewrite_pages_timing ) {

					$ellapsed = $timer->last_nano_time();
			    	error_log("${prefix}_categories updated, ellapsed: " . $timer->ellapsed_string($ellapsed));

				}

				$timer->restart();

				$create_products_table($prefix);

				$sql = <<<EOT
					INSERT INTO ${prefix}products
					SELECT
						p.*
					FROM
						rpf_products AS p
						INNER JOIN categories_registry AS c
						ON p.uuid = c.product_uuid
						INNER JOIN ${prefix}categories AS f
						ON f.uuid = c.category_uuid
EOT
				;

				$infobase->dump_plan($sql);
				$st = $infobase->prepare($sql);
				$st->bindParam(":category_uuid", $category_uuid, SQLITE3_BLOB);
				$st->execute();

				if( config::$rewrite_pages_timing ) {

					$ellapsed = $timer->last_nano_time();
			    	error_log('${prefix}_products updated, ellapsed: ' . $timer->ellapsed_string($ellapsed));

				}

			}

			$sql = <<<EOT

				WITH cte AS (
					SELECT
						a.uuid					AS uuid,
						a.code					AS code,
						a.name					AS name,
						i.uuid					AS base_image_uuid,
						i.ext					AS base_image_ext,
						a.quantity				AS remainder,
						a.price					AS price,
						COALESCE(r.quantity, 0)	AS reserve
					FROM
						${prefix}products AS a
							LEFT JOIN images AS i
							ON a.base_image_uuid = i.uuid
								AND i.ext > ''
							LEFT JOIN reserves_registry AS r
							ON a.uuid = r.product_uuid
					)
EOT
				;

			$union = '';

			foreach( $orders as $order_index => $order ) {

				foreach( $directions as $direction_index => $direction ) {

					$sql .= <<<EOT

                        ${union}
						SELECT
							${order_index} AS o,
							${direction_index} AS d,
							a.*
						FROM
							(SELECT * FROM cte ORDER BY ${order} ${direction}, uuid) AS a
EOT
					;

					$union = 'UNION ALL';

				}

			}

			$table = "products_${category_name}pages";
			$table_version = $infobase->products_pages_version($table, 3) + 1;
			$table .= '_v' . $table_version;
			$infobase->exec($infobase->products_pages_ddl($table));

			extract($fields_extractor, EXTR_OVERWRITE | EXTR_PREFIX_ALL, 'r');

			$gf = implode(array_keys($fields_extractor), ', ');
			$gv = ':' . implode(array_keys($fields_extractor), ', :');

			$st = $infobase->prepare("INSERT INTO ${table} (${gf}) VALUES (${gv})");

			$st->bindParam(":pgnon", $r_pgnon);

			foreach( $fields_uuid as $field ) {
				$n = "r_${field}";
				$st->bindParam(":${field}", $$n, SQLITE3_BLOB);
			}

			foreach( $fields as $field ) {
				$n = "r_${field}";
				$st->bindParam(":${field}", $$n);
			}

			$timer->restart();

			$infobase->dump_plan($sql);
			$ste = $infobase->prepare($sql);
			$res = $ste->execute();

			$i = $j = $n = null;
			$upd = 0;

			while( $r = $res->fetchArray(SQLITE3_ASSOC) ) {

				extract($r, EXTR_OVERWRITE | EXTR_PREFIX_ALL, 'r');

				$ordir = ($r_o << 1) | $r_d;

				if( $n !== $ordir ) {
					$j = -1;
					$i = 0;
					$n = $ordir;
				}

				if( ($i % $pgsz) === 0 )
					$j++;

				//                     four bits            three bits
				$r_pgnon = get_pgnon($r_o, $r_d, $j, $i % $pgsz);
				$i++;

				$st->execute();

				$upd++;

			}

			$upd = (int) ($upd / (count($orders) * count($directions)));
			$pgupd += (int) ($upd / $pgsz) + (($upd % $pgsz) > 0 ? 1 : 0);

			if( config::$rewrite_pages_timing ) {

				$ellapsed = $timer->last_nano_time();
		    	error_log("${table} updated, ellapsed: " . $timer->ellapsed_string($ellapsed));

			}

			//$infobase->sqlite_tx_duration($tx_timer, __FILE__, __LINE__);

			if( config::$analyze_sqlite_tables )
				$infobase->exec("ANALYZE ${table}");

		}

		$infobase->exec('DELETE FROM dirties WHERE entity = \'products_pages\'');

	}

	$infobase->commit_transaction();

	if( $pgupd !== 0 ) {

		if( config::$log_timing ) {

			list($ellapsed, $seconds) = $timer->nano_time();
			$rps = $seconds != 0 ? bcdiv($pgupd, $seconds, 2) : $pgupd;

		    error_log(sprintf('%u', $pgupd) . ' products pages updated, ' . $rps . ' pps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

	$trigger = new \events_trigger;
	$trigger->push();

}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
