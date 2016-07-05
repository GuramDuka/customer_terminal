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
class categorer_handler extends handler {

	protected $infobase_;

	protected function handle_request() {

		$start_time = micro_time();

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract(get_object_vars($this->request_));

		$product_uuid = uuid2bin($product);

		$this->infobase_->exec('BEGIN TRANSACTION');

		$this->infobase_->exec(<<<EOT
			CREATE TEMP TABLE IF NOT EXISTS t_properties (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				code       		INTEGER,
				name       		TEXT
			)
EOT
		);

		$this->infobase_->exec(<<<EOT
			CREATE TEMP TABLE IF NOT EXISTS t_product_properties (
				property_uuid	BLOB,
				property_name	TEXT,
				property_idx	INTEGER,
				value_uuid		BLOB,
				value_type		INTEGER,
				value_b			INTEGER,
				value_n			NUMERIC,
				value_s			TEXT
			)
EOT
		);

		$st = $this->infobase_->query(<<<EOT
			SELECT
				uuid
			FROM
				properties_assignments
			WHERE
				name = 'Справочник "Номенклатура"'
EOT
		);

		$result = $st->execute();

		while( list($assigment_uuid) = $result->fetchArray(SQLITE3_NUM) );

		$st = $this->infobase_->prepare(<<<EOT
			INSERT INTO t_properties
			SELECT
				uuid,
				code,
				name
			FROM
				properties
			WHERE
				assigment_uuid = :assigment_uuid
			ORDER BY
				name
EOT
		);

		$st->bindParam(":assigment_uuid", $assigment_uuid, SQLITE3_BLOB);
		$st->execute();

		$st = $this->infobase_->prepare(<<<EOT
			INSERT INTO t_product_properties
			SELECT
				p.property_uuid,
				p.name AS property_name,
				p.idx AS property_idx,
			FROM
				properties_registry AS p
					INNER JOIN properties_values AS v
					ON p.value_uuid = v.uuid
			WHERE
				p.object_uuid = :product_uuid
EOT
		);

		$st->bindParam(":product_uuid", $product_uuid, SQLITE3_BLOB);
		$st->execute();

		$st = $this->infobase_->prepare(<<<EOT
			SELECT
				t.uuid,
				t.name,
				p.idx,
				p.value_uuid,
				p.value_type,
				COALESCE(p.value_b, p.value_n, p.value_s) AS value
			FROM
				t_properties AS t
					LEFT JOIN t_product_properties AS p
					ON t.uuid = p.property_uuid
			ORDER BY
				t.name,
				p.idx
EOT
		);

		$result = $st->execute();

		$properties = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			$r['uuid'] = bin2uuid($r['uuid']);
			$r['name'] = htmlspecialchars($r['name'], ENT_HTML5);

			$categories[] = $r;

		}

		$this->response_['properties'] = $properties;

		$st = $this->infobase_->prepare(<<<EOT
			SELECT
				a.uuid					AS uuid,
				a.name					AS name,
				a.base_image_uuid		AS base_image_uuid,
				i.ext					AS base_image_ext
				q.quantity				AS remainder,
				p.price					AS price,
				COALESCE(r.quantity, 0)	AS reserve
			FROM
				products AS a
					INNER JOIN images AS i
					ON a.base_image_uuid = i.uuid
					INNER JOIN prices_registry AS p
					ON a.product_uuid = p.product_uuid
					INNER JOIN remainders_registry AS q
					ON a.uuid = q.product_uuid
					LEFT JOIN reserves_registry AS r
					ON a.uuid = r.product_uuid
			WHERE
				a.uuid = :product_uuid
EOT
		);

		$result = $st->execute();

		$this->response_['product'] = $result->fetchArray(SQLITE3_ASSOC);

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_s = ellapsed_time_string($ellapsed_ms);

		$this->response_['ellapsed'] = $ellapsed_s;

		if( config::$log_timing )
		    error_log('product properties list retrieved, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
