<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
function get_product_path($uuid, $dir_sep = DIRECTORY_SEPARATOR, $range = 256) {

	$w = strlen(dechex($range - 1));
	$h = hexdec(substr(hash('haval256,3', $uuid), -7)) % $range;

	return 'view' . $dir_sep . 'products' . $dir_sep . 'list' . $dir_sep
		. sprintf("%0${w}x", $h);

}
//------------------------------------------------------------------------------
function get_image_path($uuid, $dir_sep = DIRECTORY_SEPARATOR, $range = 256) {

	$w = strlen(dechex($range - 1));
	$h = hexdec(substr(hash('haval256,3', $uuid), -7)) % $range;

	return 'images' . $dir_sep . 'products' . $dir_sep . sprintf("%0${w}x", $h);

}
//------------------------------------------------------------------------------
function uuid2table_name($uuid, $suf = '_') {

	return $uuid !== null ? str_replace('-', '_', $uuid) . $suf : '';

}
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

	if( $r->fetchArray(SQLITE3_NUM) ) {

		$r = $infobase->query(<<<'EOT'
			SELECT
				NULL
			UNION ALL
			SELECT
				uuid
			FROM
				categories
			WHERE
				selection
				AND display
EOT
		);

		$categories = [];

		while( list($uuid) = $r->fetchArray(SQLITE3_NUM) )
			$categories[] = $uuid;

		foreach( $categories as $category_uuid ) {

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
					$v["r_${order}_${direction}"] = null;

			extract($v);

			// assign extracted variables

			foreach( $orders as $order )
				foreach( $directions as $direction ) {

				$vn = "st_${order}_${direction}";
				$vr = "r_${order}_${direction}";

				$cte_name = 'products';
				$cte = '';

				if( $category_uuid !== null ) {

					$cte_name .= '_cte';

					$cte = <<<EOT
						WITH products_cte AS (
						    SELECT
								a.*
							FROM
								products AS a
									INNER JOIN categories_registry AS c
									ON a.uuid = c.product_uuid
										/*AND c.category_uuid = :category_uuid*/
						    WHERE
								c.category_uuid = :category_uuid
						)
EOT
					;

				}

				$sql = <<<EOT
					${cte}
					SELECT
						a.uuid					AS ${order}_${direction}_uuid,
						a.code					AS ${order}_${direction}_code,
						a.name					AS ${order}_${direction}_name,
						a.base_image_uuid		AS ${order}_${direction}_base_image_uuid,
						i.ext					AS ${order}_${direction}_base_image_ext,
						p.price					AS ${order}_${direction}_price,
						q.quantity				AS ${order}_${direction}_quantity,
						COALESCE(r.quantity, 0)	AS ${order}_${direction}_reserve
					FROM
						${cte_name} AS a
							INNER JOIN images AS i
							ON a.base_image_uuid = i.uuid
							INNER JOIN prices_registry AS p
							ON a.uuid = p.product_uuid
							INNER JOIN remainders_registry AS q
							ON a.uuid = q.product_uuid
							LEFT JOIN reserves_registry AS r
							ON a.uuid = r.product_uuid
					WHERE
						a.code > 0
						AND a.name > ''
						AND p.price > 0
						AND q.quantity - COALESCE(r.quantity, 0) > 0
						AND i.ext IS NOT NULL
					ORDER BY
						${order}_${direction}_${order} ${direction},
						a.uuid
EOT
				;

				$infobase->dump_plan($sql);
				$$vn = $infobase->prepare($sql);
				$$vn->bindParam(":category_uuid", $category_uuid, SQLITE3_BLOB);
				$$vr = $$vn->execute();

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

			for( $j = -1, $i = -1; ; ) {

				$r = null;

				foreach( $orders as $order ) {

					foreach( $directions as $direction ) {

						$n = "r_${order}_${direction}";
						$r = $$n->fetchArray(SQLITE3_ASSOC);

						if( !$r )
							break;

						extract($r);

					}

					if( !$r )
						break;
			
				}

				if( !$r )
					break;

				$i++;

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

		/*$start_time = micro_time();
		$infobase->exec('VACUUM');
		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);

	    error_log('SQLITE3 VACUUM, ellapsed: ' . ellapsed_time_string($ellapsed_ms));*/

		$start_time = micro_time();
		$infobase->exec('ANALYZE');
		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);

	    error_log('SQLITE ANAYLIZE, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
