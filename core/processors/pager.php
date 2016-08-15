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

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		$pgsz = config::$page_size;

		extract($this->request_);

		$this->infobase_->begin_immediate_transaction();

		$category_uuid = uuid2bin($category);
		$table = $category_table = 'products_' . uuid2table_name($category) . 'pages';

		$bind_values = [
			'pgnon0' => $pgno << 4,
			'pgnon1' => ($pgno << 4) + ((1 << 4) - 1)
		];

		$limit = $before = '';

		$car_uuid = uuid2bin(@$car);

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

				$sql .= <<<EOT
					, car_sels_props_all AS (
						SELECT
							p.*,
							r.*
						FROM
							cte AS p
								INNER JOIN cars_selections_registry AS rs
								ON rs.car_uuid = :car_uuid
									AND rs.category_uuid = :category_uuid
					)
					, car_sels_props AS (
						SELECT DISTINCT
							f.*
						FROM
							car_sels_props_all AS f
					)
EOT
				;

				for( $i = 0; i < config::$cars_selections_registry_max_values_on_row; $i++ )
					$sql .= <<<EOT
						LEFT JOIN properties_registry AS r${i}
						ON f.${order}_${direction}_uuid = r${i}.object_uuid
							AND f.value${i}_uuid = r${i}.value_uuid
EOT
					;

				$sql .= <<<'EOT'
					WHERE
EOT
				;

				for( $i = 0; i < config::$cars_selections_registry_max_values_on_row; $i++ ) {

					$sql .= ($i > 0 ? ' AND ' : '') . <<<EOT
						f.value${i}_uuid IS NOT NULL AND r${i}.value_uuid IS NOT NULL
EOT
					;

				}

				$table = 'car_sels_props';

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

		$st->bindValue(":car_uuid", $car_uuid, SQLITE3_BLOB);

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
