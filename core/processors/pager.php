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

		$this->infobase_->begin_immediate_transaction();

		$category_uuid = uuid2bin($category);
		$category_x = bin2uuid($category_uuid, '');
		$table = $category_table = 'products_' . uuid2table_name($category) . 'pages';

		$limit = $before = '';

		$car = @$car;
		$car_uuid = uuid2bin($car);
		$car_x = bin2uuid($car_uuid, '');

		$bind_values = [
			'pgnon0'		=> $pgno << 4,
			'pgnon1'		=> ($pgno << 4) + ((1 << 4) - 1),
			'car_uuid'		=> $car_uuid,
			'category_uuid'	=> $category_uuid
		];

		if( @$selections !== null || @$car !== null ) {

			$offset = $pgno * $pgsz;
			$limit = "LIMIT ${pgsz} OFFSET ${offset}";
			$sql = <<<EOT
				SELECT DISTINCT
					p.*
				FROM
					${category_table} AS p
EOT
			;

			if( @$selections === null ) $selections = [];

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
							ON p.${order}_${direction}_uuid = r${i}.object_uuid
								AND r${i}.property_uuid = :property_${i}_uuid
								AND r${i}.value_uuid IN (${s})
EOT
				;

			}

			$before = <<<EOT
				WITH cte AS (
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
						ON f.${order}_${direction}_uuid = r${i}.object_uuid
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
							f.value${i}_uuid = r${i}.value_uuid
							OR (
								CASE
									WHEN f.property${i}_uuid IN (${properties_x_list}) THEN
										f.value${i}_uuid
									ELSE
										NULL
								END IS NULL
								AND
								CASE
									WHEN r${i}.property_uuid IN (${properties_x_list}) THEN
										r${i}.value_uuid
								ELSE
									NULL
								END IS NULL
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
				p.${order}_${direction}_uuid			AS uuid,
				p.${order}_${direction}_code			AS code,
				p.${order}_${direction}_name			AS name,
				p.${order}_${direction}_base_image_uuid	AS base_image_uuid,
				p.${order}_${direction}_base_image_ext	AS base_image_ext,
				p.${order}_${direction}_price			AS price,
				p.${order}_${direction}_remainder		AS remainder,
				p.${order}_${direction}_reserve			AS reserve, c.objects
			FROM
				${table} AS p, cnt AS c
			WHERE
				p.pgnon BETWEEN :pgnon0 AND :pgnon1
			ORDER BY
				p.pgnon
			${limit}
EOT
		;

		if( @$selections !== null || @$car !== null ) {

			$sql = str_replace('p.pgnon BETWEEN :pgnon0 AND :pgnon1', '1', $sql);

		}
		else {

			$sql = str_replace(', c.objects', '', $sql);
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
				'img_url'	=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext), ENT_HTML5)
			];

		}

		$this->response_['products'] = $page;

		if( config::$pager_timing ) {

			$ellapsed = $timer->last_nano_time();
	    	error_log('page fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		if( @$selections !== null ) {

			$this->response_['pages'] = (int) ($objects / $pgsz) + ($objects % $pgsz !== 0 ? 1 : 0);

		}
		else {

			$r = $this->infobase_->query("SELECT max(pgnon) FROM ${category_table}");
			list($pgnon) = $r->fetchArray(SQLITE3_NUM);
			$this->response_['pages'] = $r ? ($pgnon >> 4) + 1 : 0;

		}

		$this->response_['page_size'] = config::$page_size;

		$this->infobase_->commit_immediate_transaction();

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
