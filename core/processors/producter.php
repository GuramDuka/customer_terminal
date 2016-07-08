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
class producter_handler extends handler {

	protected function handle_request() {

		$start_time = micro_time();

		$infobase = new infobase;
		$infobase->set_create_if_not_exists(false);
		$infobase->initialize();

		extract(get_object_vars($this->request_));

		$product_uuid = uuid2bin($product);

		$infobase->exec('BEGIN TRANSACTION');

		/*$infobase->exec(<<<EOT
			CREATE TEMP TABLE IF NOT EXISTS t_properties (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				code       		INTEGER,
				name       		TEXT
			)
EOT
		);

		$infobase->exec(<<<EOT
			CREATE TEMP TABLE IF NOT EXISTS t_product_properties (
				property_name	TEXT,
				property_uuid	BLOB,
				property_idx	INTEGER,
				value_uuid		BLOB,
				value_type		INTEGER,
				value_b			INTEGER,
				value_n			NUMERIC,
				value_s			TEXT
			)
EOT
		);

		$m = $infobase->escapeString('Справочник "Номенклатура"');

		$result = $infobase->query(<<<EOT
			SELECT
				a.uuid
			FROM
				properties_assignments AS a
			WHERE
				a.name = '${m}'
EOT
		);

		while( $r = $result->fetchArray(SQLITE3_NUM) )
			$assignment_uuid = $r[0];

		$st = $infobase->prepare(<<<EOT
			INSERT INTO t_properties
			SELECT
				uuid,
				code,
				name
			FROM
				properties
			WHERE
				assignment_uuid = :assignment_uuid
EOT
		);

		$st->bindParam(':assignment_uuid', $assignment_uuid, SQLITE3_BLOB);
		$st->execute();

		$st = $infobase->prepare(<<<EOT
			INSERT INTO t_product_properties
			SELECT
				p.name			AS property_name,
				r.property_uuid	AS property_uuid,
				r.idx			AS property_idx,
				v.uuid			AS value_uuid,
				v.value_type	AS value_type,
				v.value_b		AS value_b,
				v.value_n		AS value_n,
				v.value_s		AS value_s
			FROM
				properties_registry AS r
					INNER JOIN properties AS p
					ON r.property_uuid = p.uuid
					INNER JOIN properties_values AS v
					ON r.value_uuid = v.uuid
			WHERE
				r.object_uuid = :product_uuid
EOT
		);

		$st->bindParam(':product_uuid', $product_uuid, SQLITE3_BLOB);
		$st->execute();

		$st = $infobase->prepare(<<<EOT
			SELECT
				t.property_uuid								AS property_uuid,
				t.property_name								AS property_name,
				t.property_idx								AS property_idx,
				t.value_uuid								AS value_uuid,
				t.value_type								AS value_type,
				COALESCE(t.value_b, t.value_n, t.value_s)	AS value
			FROM
				t_product_properties AS t
			ORDER BY
				t.property_name,
				t.property_idx
EOT
		);

		$result = $st->execute();*/

		$sql = <<<EOT
			SELECT
				p.name										AS property_name,
				r.property_uuid								AS property_uuid,
				r.idx										AS property_idx,
				v.uuid										AS value_uuid,
				v.value_type								AS value_type,
				COALESCE(v.value_b, v.value_n, v.value_s)	AS value

			FROM
				properties_registry AS r
					INNER JOIN properties AS p
					ON r.property_uuid = p.uuid
					INNER JOIN properties_values AS v
					ON r.value_uuid = v.uuid
			WHERE
				r.object_uuid = :product_uuid
EOT
		;

		$infobase->dump_plan($sql);

		$start_time_st = micro_time();

		$st = $infobase->prepare($sql);
		$st->bindParam(':product_uuid', $product_uuid, SQLITE3_BLOB);

		$result = $st->execute();

		$properties = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			if( $property_name === 'Наименование портал' )
				continue;

			$properties[] = [
				'property_uuid'	=> bin2uuid($property_uuid),
				'property_name'	=> htmlspecialchars($property_name, ENT_HTML5),
				'property_idx'	=> $property_idx,
				'value_uuid'	=> bin2uuid($value_uuid),
				'value_type'	=> $value_type,
				'value'			=> is_string($value) ? htmlspecialchars($value, ENT_HTML5) : $value
			];

		}

		$this->response_['properties'] = $properties;

		if( config::$producter_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time_st);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

	    	error_log('product properties fetch, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

		$sql = <<<EOT
			SELECT
				a.uuid					AS uuid,
				a.code					AS code,
				a.name					AS name,
				a.base_image_uuid		AS base_image_uuid,
				i.ext					AS base_image_ext,
				q.quantity				AS remainder,
				p.price					AS price,
				COALESCE(r.quantity, 0)	AS reserve
			FROM
				products AS a
					INNER JOIN images AS i
					ON a.base_image_uuid = i.uuid
					INNER JOIN prices_registry AS p
					ON a.uuid = p.product_uuid
					INNER JOIN remainders_registry AS q
					ON a.uuid = q.product_uuid
					LEFT JOIN reserves_registry AS r
					ON a.uuid = r.product_uuid
			WHERE
				a.uuid = :product_uuid
EOT
		;

		$infobase->dump_plan($sql);

		$start_time_st = micro_time();

		$st = $infobase->prepare($sql);
		$st->bindParam(':product_uuid', $product_uuid, SQLITE3_BLOB);
		$result = $st->execute();
		$r = $result->fetchArray(SQLITE3_ASSOC);

		if( $r ) {

			extract($r);

			$this->response_['product'] = [
				'uuid'		=> bin2uuid($uuid),
				'code'		=> $code,
				'name'		=> htmlspecialchars($name, ENT_HTML5),
				'price'		=> $price,
				'remainder'	=> $remainder,
				'reserve'	=> $reserve,
				'img_url'	=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext), ENT_HTML5)
			];

		}

		if( config::$producter_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time_st);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

	    	error_log('product info fetch, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

		$sql = <<<EOT
			SELECT
				s.uuid					AS uuid,
				s.name					AS name,
				r.remainder_quantity	AS remainder,
				r.reserve_quantity		AS reserve
			FROM
				system_remainders_registry AS r
					INNER JOIN shops s
					ON r.shop_uuid = s.uuid
			WHERE
				r.product_uuid = :product_uuid
			ORDER BY
				r.remainder_quantity DESC,
				s.name
EOT
		;

		$infobase->dump_plan($sql);

		$start_time_st = micro_time();

		$st = $infobase->prepare($sql);
		$st->bindParam(':product_uuid', $product_uuid, SQLITE3_BLOB);
		$result = $st->execute();

		$remainders = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$remainders[] = [
				'shop_uuid'	=> bin2uuid($uuid),
				'shop_name'	=> htmlspecialchars($name, ENT_HTML5),
				'remainder'	=> $remainder,
				'reserve'	=> $reserve
			];

		}

		$this->response_['remainders'] = $remainders;

		if( config::$producter_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time_st);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

	    	error_log('product remainder fetch, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

		$infobase->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_s = ellapsed_time_string($ellapsed_ms);

		$this->response_['ellapsed'] = $ellapsed_s;

		if( config::$log_timing )
		    error_log('product info retrieved, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
