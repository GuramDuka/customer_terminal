<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class system_remainders_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$dimensions = [
			'infobase_uuid',
			'product_uuid',
			'storage_uuid',
			'organization_uuid',
			'recipient_uuid',
			'package_id_uuid',
		];

		$all_fields = array_merge($dimensions, [
			'shop_uuid',
			'remainder_quantity',
			'reserve_quantity'
		]);
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$start_time = micro_time();

		$this->infobase_->exec('BEGIN TRANSACTION');

		$st_records_ins = null;
		$st_records_del = null;
		$st_totals_add = null;
		$st_totals_sub = null;
		$st_totals_del = null;

		$where_alias = '';
		$where = '';

		foreach( $dimensions as $dim ) {

			$w = <<<EOT
				AND (r.${dim} = :${dim}
					OR r.${dim} IS NULL)
EOT
			;

			$where_alias .= $w;
			$where .= str_replace('r.', '', $w);

		}

		$st_totals_op = <<<'EOT'
			REPLACE INTO
				system_remainders_registry
			SELECT
				r.shop_uuid,
				r.product_uuid,
				COALESCE(t.remainder_quantity, 0) ${op} r.remainder_quantity,
				COALESCE(t.reserve_quantity, 0) ${op} r.reserve_quantity
			FROM
				system_remainders_records_registry AS r
				LEFT JOIN system_remainders_registry AS t
				ON r.shop_uuid = t.shop_uuid
					AND r.product_uuid = t.product_uuid
			WHERE
				1
EOT
		;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract(get_object_vars($object));

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			// subtract existing records from totals
			if( $st_totals_sub === null ) {

				$st_totals_sub = $this->infobase_->prepare(str_replace('${op}', '-', $st_totals_op . "${where_alias}"));

				foreach( $dimensions as $field )
					$st_totals_sub->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_totals_sub->execute();

			if( $st_totals_del === null ) {

				$st_totals_del = $this->infobase_->prepare(<<<EOT
					DELETE FROM
						system_remainders_registry
					WHERE
						shop_uuid IN (
							SELECT
								shop_uuid
							FROM
								system_remainders_records_registry
							WHERE
								1
								${where}
						)
						AND product_uuid IN (
							SELECT
								product_uuid
							FROM
								system_remainders_records_registry
							WHERE
								1
								${where}
						)
						AND (remainder_quantity = 0
							OR remainder_quantity IS NULL)
						AND (reserve_quantity = 0
							OR reserve_quantity IS NULL)
EOT
				);

				foreach( $dimensions as $field )
					$st_totals_del->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_totals_del->execute();

			if( $st_records_del === null ) {

				$st_records_del = $this->infobase_->prepare(<<<EOT
					DELETE FROM
						system_remainders_records_registry
					WHERE
						1
						${where}
EOT
				);

				foreach( $dimensions as $field )
					$st_records_del->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_records_del->execute();

			if( @$recordset !== null )
				foreach( $recordset as $record ) {

					// object may not present all fields then need initialize
					foreach( $all_fields as $field )
						$$field = null;

					extract(get_object_vars($record));

					foreach( $fields_uuid as $field )
						$$field = uuid2bin(@$$field);

					if( $st_records_ins === null ) {

						$gf = implode(', ', $all_fields);
						$gv = implode(', :', $all_fields);

						$st_records_ins = $this->infobase_->prepare("INSERT INTO system_remainders_records_registry (${gf}) VALUES (:${gv})");

						foreach( $fields_uuid as $field )
							$st_records_ins->bindParam(":${field}", $$field, SQLITE3_BLOB);

						foreach( $fields as $field )
							$st_records_ins->bindParam(":${field}", $$field);

					}

					$st_records_ins->execute();

				}

			// addition existing records to totals
			if( $st_totals_add === null ) {

				$st_totals_add = $this->infobase_->prepare(str_replace('${op}', '+', $st_totals_op . "${where_alias}"));

				foreach( $dimensions as $field )
					$st_totals_add->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_totals_add->execute();

		}

		$entity = $this->infobase_->escapeString('products_pages');
		$this->infobase_->exec("REPLACE INTO dirties (entity) VALUES ('${entity}')");

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
		$cnt = count($this->objects_);
		$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

	    error_log(sprintf('%u', $cnt) . ' system remainders registry updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>