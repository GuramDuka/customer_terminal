<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
function rewrite_pages($infobase) {

	$pgsz = config::$page_size;

	$all_fields = [ 'uuid', 'code', 'name', 'base_image_uuid', 'base_image_ext', 'price', 'quantity', 'reserve' ];

	$fields = [];
	$fields_uuid = [];

	foreach( $all_fields as $field )
		if( substr($field, -4) === 'uuid' )
			$fields_uuid[] = $field;
		else
			$fields[] = $field;


	$orders = [ 'code', 'name', 'price', 'quantity' ];
	$directions = [ 'asc', 'desc' ];

	$pgupd = 0;

	$start_time = micro_time();

	$infobase->exec('BEGIN TRANSACTION');

	$entity = $infobase->escapeString('products_pages');
	$r = $infobase->query("SELECT entity FROM dirties WHERE entity = '${entity}'");

	if( $r->fetchArray(SQLITE3_NUM) || config::$force_rewrite_pages ) {

		$sql = <<<'EOT'
			SELECT
				NULL
			UNION ALL
			SELECT
				uuid
			FROM
				categories
EOT
		;

		$infobase->dump_plan($sql);

		$result = $infobase->query($sql);

		$categories = [];

		while( $r = $result->fetchArray(SQLITE3_NUM) )
			$categories[] = $r[0];

		foreach( $categories as $category_uuid ) {

			$sql = <<<'EOT'
				WITH cte0 AS (
					SELECT
						uuid
					FROM
						categories
					WHERE
						uuid = :category_uuid
				),
				cte1 AS (
					SELECT
						uuid
					FROM
						categories
					WHERE
						parent_uuid IN (SELECT uuid FROM cte0)
				),
				cte2 AS (
					SELECT
						uuid
					FROM
						categories
					WHERE
						parent_uuid IN (SELECT uuid FROM cte1)
				),
				cte3 AS (
					SELECT
						uuid
					FROM
						categories
					WHERE
						parent_uuid IN (SELECT uuid FROM cte2)
				),
				cte4 AS (
					SELECT
						uuid
					FROM
						categories
					WHERE
						parent_uuid IN (SELECT uuid FROM cte3)
				),
				cte AS (
					SELECT uuid FROM cte0
					UNION ALL
					SELECT uuid FROM cte1
					UNION ALL
					SELECT uuid FROM cte2
					UNION ALL
					SELECT uuid FROM cte3
					UNION ALL
					SELECT uuid FROM cte4
				)
				SELECT
					a.*
				FROM
					cte AS a
				WHERE
					uuid = :category_uuid
					OR EXISTS(SELECT 1 FROM categories_registry AS c WHERE a.uuid = c.category_uuid LIMIT 1)
EOT
			;

			$infobase->dump_plan($sql);
			$st = $infobase->prepare($sql);

			$st->bindParam(":category_uuid", $category_uuid, SQLITE3_BLOB);
			$result = $st->execute();
			$sub_categories = [];

			while( $r = $result->fetchArray(SQLITE3_NUM) )
				$sub_categories[] = $r[0];

			$s = '';

			for( $i = 0; $i < count($sub_categories); $i++ ) {

				$s .= ", :category${i}_uuid";
				$n = "category${i}_uuid";
				$$n = $sub_categories[$i];

			}

			$condition	= empty($s) ? '' : 'category_uuid IN (' . substr($s, 2) . ') AND';
			$cut0		= empty($s) ? '' : 'c.category_uuid AS category_uuid,';
			$cut1		= empty($s) ? '' : 'categories_registry AS c INNER JOIN';
			$cut2		= empty($s) ? '' : 'ON c.product_uuid = a.uuid';

			//CREATE TEMPORARY TABLE Tcats AS
			//WITH ft_cte AS (
			//    SELECT uuid, name FROM categories
			//    WHERE selection
			//)
			//SELECT * FROM ft_cte;

			// CREATE TABLE IF NOT EXISTS products_${category_uuid}_pages AS
			// SELECT *
			// FROM products_pages
			// WHERE pgnon IS NULL;

			// only not empty name and have image, price, quantity

			$category_table = 'products_' . uuid2table_name(bin2uuid($category_uuid)) . 'pages';

			/*$infobase->exec(<<<EOT
				CREATE TABLE IF NOT EXISTS ${category_table} AS
				SELECT
					*
				FROM
					products_pages
				WHERE
					0
EOT
			);*/
			$infobase->exec($infobase->create_table_products_pages($category_table));

			// extract variables in this scope // foreach( $categories as $category_uuid )
			$v = [];

			foreach( $orders as $order )
				foreach( $directions as $direction )
					$v["a_${order}_${direction}"] = [];

			extract($v);

			// assign extracted variables

			foreach( $orders as $order )
				foreach( $directions as $direction ) {

				//$vn = "st_${order}_${direction}";
				//$vr = "r_${order}_${direction}";

				$sql = <<<EOT
					SELECT
						${cut0}
						a.uuid					AS ${order}_${direction}_uuid,
						a.code					AS ${order}_${direction}_code,
						a.name					AS ${order}_${direction}_name,
						a.base_image_uuid		AS ${order}_${direction}_base_image_uuid,
						i.ext					AS ${order}_${direction}_base_image_ext,
						q.quantity				AS ${order}_${direction}_quantity,
						p.price					AS ${order}_${direction}_price,
						COALESCE(r.quantity, 0)	AS ${order}_${direction}_reserve
					FROM
						${cut1} products AS a
							${cut2}
							INNER JOIN images AS i
							ON a.base_image_uuid = i.uuid
							INNER JOIN prices_registry AS p
							ON a.uuid = p.product_uuid
							LEFT JOIN reserves_registry AS r
							ON a.uuid = r.product_uuid
							INNER JOIN remainders_registry AS q
							ON a.uuid = q.product_uuid
					WHERE
						${condition}
						${order}_${direction}_code > 0
						AND ${order}_${direction}_name > ''
						AND ${order}_${direction}_price > 0
						AND ${order}_${direction}_base_image_ext IS NOT NULL
						AND ${order}_${direction}_quantity > 0
					ORDER BY
						${order}_${direction}_${order} ${direction},
						${order}_${direction}_uuid
EOT
				;

				$infobase->dump_plan($sql);
				$ste = $infobase->prepare($sql);

				for( $i = 0; $i < count($sub_categories); $i++ ) {

					$n = "category${i}_uuid";
					$ste->bindParam(":${n}", $$n, SQLITE3_BLOB);

				}

				$res = $ste->execute();

				$a = "a_${order}_${direction}";
				$v = [];

				while( $r = $res->fetchArray(SQLITE3_ASSOC) )
					$v[] = $r;

				$$a = $v;

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

			$st = $infobase->prepare("REPLACE INTO ${category_table} (${gf}) VALUES (${gv})");

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

			}

			$st = $infobase->prepare("DELETE FROM ${category_table} WHERE pgnon > :pgnon");
			$st->bindParam(':pgnon', $pgnon);
			$st->execute();

			$pgupd += $pgnon < 0 ? 0 : ($pgnon >> 4) + 1;

		}

		$infobase->exec("DELETE FROM dirties WHERE entity = '${entity}'");

	}

	$infobase->exec('COMMIT TRANSACTION');

	if( $pgupd !== 0 ) {

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
		$rps = $ellapsed_seconds != 0 ? bcdiv($pgupd, $ellapsed_seconds, 2) : $pgno;

	    error_log(sprintf('%u', $pgupd) . ' products pages updated, ' . $rps . ' pps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>