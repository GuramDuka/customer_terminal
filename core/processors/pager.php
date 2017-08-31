<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'infobase.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'handler.php';
require_once LOADERS_DIR . 'shared.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class pager_handler extends handler {

	protected $infobase_;

	protected function get_properties_x_list($category_uuid) {

		$sql = <<<EOT
			SELECT
				property_uuid
			FROM
				products_properties_by_car_setup_registry
			WHERE
				category_uuid = :category_uuid
				AND enabled
EOT
		;

		$this->infobase_->dump_plan($sql);

		$st = $this->infobase_->prepare($sql);

		$st->bindValue(":category_uuid", $category_uuid, SQLITE3_BLOB);

		$result = $st->execute();

		$xlist = '';

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$v = bin2uuid($property_uuid, '');

			$xlist .= ", x'${v}'";

		}

		return substr($xlist, 2);

	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		$pgsz = config::$page_size;

		extract($this->request_);

		$this->infobase_->begin_transaction();

		$category_uuid = uuid2bin($category);
		$category_x = bin2uuid($category_uuid, '');
		$table = $category_table = 'products_' . uuid2table_name($category) . 'pages';
		$table_version = $this->infobase_->products_pages_version($table);
		$table = $category_table = $table . '_v' . $table_version;

		$limit = $before = '';
		$sorting = 'p.pgnon';

		$selections = @$selections;
		$car = @$car;
		$car_uuid = uuid2bin($car);
		$car_x = bin2uuid($car_uuid, '');

		[ $orders, $directions ] = get_orders_directions();

		$o = array_search($order, $orders);
		$d = array_search($direction, $directions);

		$bind_values = [
			'pgnon0'		=> get_pgnon($o, $d, $pgno,  0),
			'pgnon1'		=> get_pgnon($o, $d, $pgno, -1),
			'car_uuid'		=> $car_uuid,
			'category_uuid'	=> $category_uuid
		];

		$pgnon0 = get_pgnon($o, $d, 0,  0);
		$pgnon1 = get_pgnon($o, $d, -1, -1);

		if( $selections !== null || $car !== null ) {

			$sql = <<<EOT
				WITH ctep AS (
					SELECT
						*
					FROM
						${category_table}
					WHERE
						pgnon BETWEEN ${pgnon0} AND ${pgnon1}
				),
				cte AS (
					SELECT
						p.*
					FROM
						ctep AS p
EOT
			;

			if( $selections !== null )
				foreach( $selections as $i => $p ) {

					$property_uuid = strtoupper(str_replace('-', '', $p['uuid']));
					$bind_values["property_${i}_uuid"] = uuid2bin($p['uuid']);

					$s = '';

					foreach( $p['values'] as $j => $v ) {

						$value_uuid = strtoupper(str_replace('-', '', $v['uuid']));
						$bind_values["value_${i}_${j}_uuid"] = uuid2bin($v['uuid']);

						$s .= ", :value_${i}_${j}_uuid";

					}

					$s = substr($s, 2);

					$sql .= <<<EOT

								INNER JOIN properties_registry AS r${i}
								ON p.uuid = r${i}.object_uuid
									AND r${i}.property_uuid = :property_${i}_uuid
									AND r${i}.value_uuid IN (${s})
EOT
					;

				}
			// end of if( $selections !== null )

			$before = <<<EOT
					${sql}
				)
EOT
			;

			$table = 'cte';

			if( @$car !== null ) {

				$sql = <<<EOT
					, car_sels_props_all AS (
						SELECT
							*
						FROM
							cte AS p
								INNER JOIN cars_selections_registry AS r
								ON r.car_uuid = :car_uuid					/* x'${car_x}' */
									AND r.category_uuid = :category_uuid	/* x'${category_x}' */
					)
					, car_products AS (
						SELECT
							*
						FROM
							car_sels_props_all AS f
EOT
				;

				for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ )
					$sql .= <<<EOT

						LEFT JOIN properties_registry AS r${i}
						ON f.uuid = r${i}.object_uuid
							AND f.property${i}_uuid = r${i}.property_uuid
							AND f.value${i}_uuid = r${i}.value_uuid
EOT
					;

				$sql .= <<<'EOT'

					WHERE
EOT
				;

				$properties_x_list = $this->get_properties_x_list($category_uuid);

				for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ ) {

					if( $i > 0 )
						$sql .= <<<EOT

						AND

EOT
					;

					$sql .= <<<EOT
						(
							(
								f.value${i}_uuid IS NOT NULL
								AND r${i}.value_uuid IS NOT NULL
								AND f.property${i}_uuid IN (${properties_x_list})
								AND r${i}.property_uuid IN (${properties_x_list})
							)
							OR (
								(
									f.value${i}_uuid IS NULL
									OR f.property${i}_uuid NOT IN (${properties_x_list})
								)
								AND	(
									r${i}.value_uuid IS NULL
									OR r${i}.property_uuid NOT IN (${properties_x_list})
								)
							)
						)
EOT
					;

				}

				$sql .= <<<'EOT'

				)

EOT
				;

				$before .= $sql;
				$table = 'car_products';

			}

		}

		$fts_filter = trim(@$fts_filter);

		if( mb_strlen($fts_filter) < 1 )
			$fts_filter = null;

		if( $fts_filter !== null ) {

/*			$sql = <<<EOT
			SELECT
				replace(replace(replace(replace(replace(
				replace(replace(replace(replace(replace(hex(uuid),
					'0', 'G'), '1', 'H'), '2', 'I'), '3', 'K'), '4', 'L'),
					'5', 'M'), '6', 'N'), '7', 'O'), '8', 'P'), '9', 'Q') AS anchor
			FROM
				${category_table}
			WHERE
				pgnon BETWEEN ${pgnon0} AND ${pgnon1}
EOT
			;

			$result = $this->infobase_->query($sql);
			$anchor_filter = '';

			while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

				extract($r);

				$anchor_filter .= " OR ${anchor}";

			}

			$anchor_filter = '(' . substr($anchor_filter, 4) . ')';*/

			$filter = $this->infobase_->escapeString(transform_fts_filter($fts_filter));
			$raw_filter = $this->infobase_->escapeString($fts_filter);

			$sql = <<<EOT
				SELECT
					MAX(rowid), uuid
				FROM
					products_fts
				WHERE
					-- Search for matches in all columns except "barcode"
					products_fts MATCH '(- barcode : ${filter}) OR (- {code name article description} : ${raw_filter})'
				GROUP BY
       				uuid
EOT
			;
			
			//$bind_values['fts_filter'] = $anchor_filter . ' AND ' . transform_fts_filter($fts_filter);

			$with = @$selections === null && @$car === null ? 'WITH' : ',';

			$before .= <<<EOT
				${with} fts_filter AS (
					${sql}
				),
				fts_filtered_products AS (
					SELECT DISTINCT
						p.uuid				AS uuid,
						p.code				AS code,
						p.name				AS name,
						p.base_image_uuid	AS base_image_uuid,
						p.base_image_ext	AS base_image_ext,
						p.price				AS price/*,
						p.remainder			AS remainder,
						p.reserve			AS reserve*/
					FROM
						${table} AS p
							INNER JOIN fts_filter AS f
							ON p.uuid = f.uuid
				)
EOT
			;

			$table = 'fts_filtered_products';

		}

		if( $selections !== null || $car !== null || $fts_filter !== null ) {

			$offset = $pgno * $pgsz;
			$limit = "LIMIT ${pgsz} OFFSET ${offset}";
			$sorting = "${order} ${direction}, p.uuid";

			$before .= <<<EOT

				, cnt AS (
					SELECT
						count(*) AS objects
					FROM
						${table}
				)
EOT
			;

		}

		$sql = <<<EOT
			${before}
			SELECT
				p.uuid						AS uuid,
				p.code						AS code,
				p.name						AS name,
				p.base_image_uuid			AS base_image_uuid,
				p.base_image_ext			AS base_image_ext,
				p.price						AS price,
				COALESCE(m.quantity, 0)		AS remainder,
				COALESCE(r.quantity, 0)		AS reserve
				, c.objects AS objects
			FROM
				${table} AS p
					LEFT JOIN remainders_registry AS m
					ON p.uuid = m.product_uuid
					LEFT JOIN reserves_registry AS r
					ON p.uuid = r.product_uuid
				, cnt AS c
			WHERE
				p.pgnon BETWEEN :pgnon0 AND :pgnon1
			ORDER BY
			${sorting}
			${limit}
EOT
		;

		if( $selections !== null || $car !== null || $fts_filter !== null ) {

			$sql = str_replace('p.pgnon BETWEEN :pgnon0 AND :pgnon1', '1', $sql);

		}
		else {

			$sql = str_replace(', c.objects AS objects', '', $sql);
			$sql = str_replace(', cnt AS c', '', $sql);

		}

		$this->infobase_->dump_plan($sql);

		$timer->restart();

		$st = $this->infobase_->prepare($sql);

		foreach( $bind_values as $k => $v )
			if( substr($k, -4) === 'uuid' )
				$st->bindValue(":${k}", $v, SQLITE3_BLOB);
			else
				$st->bindValue(":${k}", $v);

		$result = $st->execute();

		$page = [];
		$objects = 0;

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$page[] = [
				'uuid'		=> bin2uuid($uuid),
				'code'		=> $code,
				'name'		=> htmlspecialchars($name, ENT_HTML5),
				'price'		=> $price,
				'remainder'	=> $remainder,
				'reserve'	=> $reserve,
				'img'		=> bin2uuid($base_image_uuid),
				'img_url'	=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext, false), ENT_HTML5)
			];

		}

		$this->response_['products'] = $page;

		if( config::$pager_timing ) {

			$ellapsed = $timer->last_nano_time();
	    	error_log('page fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		if( $selections !== null || $car !== null || $fts_filter !== null ) {

			$this->response_['pages'] = (int) ($objects / $pgsz) + (($objects % $pgsz) > 0 ? 1 : 0);

		}
		else {

			$r = $this->infobase_->query(<<<EOT
				SELECT
					COUNT(*)
				FROM
					${category_table}
				WHERE
					pgnon BETWEEN ${pgnon0} AND ${pgnon1}
EOT
			);
			
			[ $pgnon ] = $r->fetchArray(SQLITE3_NUM);

			$this->response_['pages'] = (int) ($pgnon / $pgsz) + (($pgnon % $pgsz) > 0 ? 1 : 0);

		}

		$this->response_['page_size'] = config::$page_size;

		$this->infobase_->commit_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('page retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		// no-cache
		//header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0'); 
		//header('Expires: ' . date("r"));
		//header('Expires: -1', false);

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
