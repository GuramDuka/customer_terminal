<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
function rewrite_pages($infobase) {

	$pgsz = config::$page_size;

	$all_fields = [ 'uuid', 'code', 'name', 'base_image_uuid', 'base_image_ext', 'price', 'remainder', 'reserve' ];

	$fields = [];
	$fields_uuid = [];

	foreach( $all_fields as $field )
		if( substr($field, -4) === 'uuid' )
			$fields_uuid[] = $field;
		else
			$fields[] = $field;


	$orders = [ 'code', 'name', 'price', 'remainder' ];
	$directions = [ 'asc', 'desc' ];

	$pgupd = 0;

	$infobase->begin_immediate_transaction();

	$timer = new \nano_timer;
	$tx_timer = new \nano_timer;

	$entity = $infobase->escapeString('products_pages');
	$r = $infobase->query("SELECT entity FROM dirties WHERE entity = '${entity}'");

	if( $r->fetchArray(SQLITE3_NUM) || config::$force_rewrite_pages ) {

		// create temp tables

		$infobase->exec(<<<'EOT'
			CREATE TEMP TABLE IF NOT EXISTS f_categories (
	    	   uuid BLOB PRIMARY KEY ON CONFLICT REPLACE
			)
EOT
		);

		foreach( [ 'rpf', 'cf' ] as $x )
			$infobase->exec(<<<EOT
				CREATE TEMP TABLE IF NOT EXISTS ${x}_products (
					uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
					code       		INTEGER,
					name       		TEXT,
					base_image_uuid	BLOB,
					quantity		NUMERIC,
					price			NUMERIC
				)
EOT
			);

		$timer->restart();

		// fetch only not empty name and have image, price, quantity
		$sql = <<<'EOT'
			REPLACE INTO rpf_products
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
					AND a.base_image_uuid IS NOT NULL
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

			// fetch categories hierarchy
			if( $category_uuid !== null ) {

				$timer->restart();

				$infobase->exec('DELETE FROM f_categories');

				$sql = <<<'EOT'
				WITH
					cte0 AS (SELECT uuid FROM categories WHERE uuid = :category_uuid),
					cte1 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte0)),
					cte2 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte1)),
					cte3 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte2)),
					cte4 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte3)),
					cte5 AS (SELECT uuid FROM categories WHERE parent_uuid IN (SELECT uuid FROM cte4))
	
					INSERT INTO f_categories
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
			    	error_log('f_categories updated, ellapsed: ' . $timer->ellapsed_string($ellapsed));

				}

				$timer->restart();

				$infobase->exec('DELETE FROM cf_products');

				$sql = <<<'EOT'
					INSERT INTO cf_products
					SELECT
						p.*
					FROM
						rpf_products AS p
						INNER JOIN categories_registry AS c
						ON p.uuid = c.product_uuid
						INNER JOIN f_categories AS f
						ON f.uuid = c.category_uuid
EOT
				;

				$infobase->dump_plan($sql);
				$st = $infobase->prepare($sql);
				$st->bindParam(":category_uuid", $category_uuid, SQLITE3_BLOB);
				$st->execute();

				if( config::$rewrite_pages_timing ) {

					$ellapsed = $timer->last_nano_time();
			    	error_log('cf_products updated, ellapsed: ' . $timer->ellapsed_string($ellapsed));

				}

			}

			// create variables in this scope // foreach( $categories as $category_uuid )
			$v = [];

			foreach( $orders as $order )
				foreach( $directions as $direction )
					$v["a_${order}_${direction}"] = [];

			extract($v);

			// assign created variables

			foreach( $orders as $order )
				foreach( $directions as $direction ) {

				$timer->restart();

				$sql = <<<EOT
					SELECT
						a.uuid					AS ${order}_${direction}_uuid,
						a.code					AS ${order}_${direction}_code,
						a.name					AS ${order}_${direction}_name,
						i.uuid					AS ${order}_${direction}_base_image_uuid,
						i.ext					AS ${order}_${direction}_base_image_ext,
						a.quantity				AS ${order}_${direction}_remainder,
						a.price					AS ${order}_${direction}_price,
						COALESCE(r.quantity, 0)	AS ${order}_${direction}_reserve
					FROM
						rpf_products AS a
							INNER JOIN images AS i
							ON a.base_image_uuid = i.uuid
								AND i.ext > ''
							LEFT JOIN reserves_registry AS r
							ON a.uuid = r.product_uuid
					ORDER BY
						${order}_${direction}_${order} ${direction},
						${order}_${direction}_uuid
EOT
				;

				if( $category_uuid !== null )
					$sql = str_replace('rpf_products', 'cf_products', $sql);

				$infobase->dump_plan($sql);
				$ste = $infobase->prepare($sql);
				$res = $ste->execute();

				$a = "a_${order}_${direction}";
				$v = [];

				while( $r = $res->fetchArray(SQLITE3_ASSOC) )
					$v[] = $r;

				$$a = $v;

				if( config::$rewrite_pages_timing ) {

					$ellapsed = $timer->last_nano_time();
			    	error_log('products by categories fetched, ellapsed: ' . $timer->ellapsed_string($ellapsed));

				}

			}

			$v = [];
			$gf = 'pgnon';
			$gv = ":${gf}";

			foreach( $orders as $order )
				foreach( $directions as $direction )
					foreach( $all_fields as $field ) {

						$v["${order}_${direction}_${field}"] = null;
						$gf .= ", ${order}_${direction}_${field}";
						$gv .= ", :${order}_${direction}_${field}";

					}

			// CREATE TABLE IF NOT EXISTS products_${category_uuid}_pages AS
			// SELECT *
			// FROM products_pages
			// WHERE pgnon IS NULL;

			$category_table = 'products_' . uuid2table_name(bin2uuid($category_uuid)) . 'pages';
			$infobase->exec("DROP TABLE IF EXISTS ${category_table}");
			$infobase->exec($infobase->create_table_products_pages($category_table));

			$st = $infobase->prepare("INSERT INTO ${category_table} (${gf}) VALUES (${gv})");

			extract($v);

			$pgnon = -1;
			$st->bindParam(':pgnon', $pgnon);

			foreach( $orders as $order )
				foreach( $directions as $direction ) {

					foreach( $fields_uuid as $field ) {
						$n = "${order}_${direction}_${field}";
						$st->bindParam(":${n}", $$n, SQLITE3_BLOB);
					}

					foreach( $fields as $field ) {
						$n = "${order}_${direction}_${field}";
						$st->bindParam(":${n}", $$n);
					}

				}

			$timer->restart();

			for( $j = -1, $i = 0; ; $i++ ) {

				$r = false;

				foreach( $orders as $order ) {

					foreach( $directions as $direction ) {

						$a = "a_${order}_${direction}";

						if( $i >= count($$a) ) {
							$r = true;
							break;
						}

						extract($$a[$i]);

					}

					if( $r )
						break;
		
				}

				if( $r )
					break;

				if( ($i % $pgsz) === 0 )
					$j++;

				$pgnon = ($j << 4) + ($i % $pgsz);

				$st->execute();

				$infobase->sqlite_tx_duration($tx_timer, __FILE__, __LINE__);

			}

			$pgupd += $pgnon < 0 ? 0 : ($pgnon >> 4) + 1;

			if( config::$rewrite_pages_timing ) {

				$ellapsed = $timer->last_nano_time();
		    	error_log("${category_table} updated, ellapsed: " . $timer->ellapsed_string($ellapsed));

			}

			$infobase->sqlite_tx_duration($tx_timer, __FILE__, __LINE__);

		}

		$infobase->exec("DELETE FROM dirties WHERE entity = '${entity}'");

	}

	$infobase->commit_immediate_transaction();

	if( $pgupd !== 0 ) {

		if( config::$log_timing ) {

			list($ellapsed, $seconds) = $timer->nano_time();
			$rps = $seconds != 0 ? bcdiv($pgupd, $seconds, 2) : $pgno;

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
