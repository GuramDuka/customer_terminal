<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class reserves_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'recorder_uuid', 'product_uuid', 'quantity' ];
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

		$st_totals_op = <<<'EOT'
			REPLACE INTO
				reserves_registry
			SELECT
				r.product_uuid,
				COALESCE(t.quantity, 0) ${op} r.quantity
			FROM
				reserves_records_registry AS r
				LEFT JOIN reserves_registry AS t
				ON r.product_uuid = t.product_uuid
			WHERE
				r.recorder_uuid = :recorder_uuid
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

				$st_totals_sub = $this->infobase_->prepare(str_replace('${op}', '-', $st_totals_op));
				$st_totals_sub->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

			}

			$st_totals_sub->execute();

			if( $st_totals_del === null ) {

				$st_totals_del = $this->infobase_->prepare(<<<'EOT'
					DELETE FROM
						reserves_registry
					WHERE
						product_uuid IN (
							SELECT
								product_uuid
							FROM
								reserves_records_registry
							WHERE
								recorder_uuid = :recorder_uuid
						)
						AND (quantity = 0
							OR quantity IS NULL)
EOT
				);

				$st_totals_del->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

			}

			$st_totals_del->execute();

			if( $st_records_del === null ) {

				$st_records_del = $this->infobase_->prepare(<<<'EOT'
					DELETE FROM
						reserves_records_registry
					WHERE
						recorder_uuid = :recorder_uuid
EOT
				);

				$st_records_del->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

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

						$st_records_ins = $this->infobase_->prepare("INSERT INTO reserves_records_registry (${gf}) VALUES (:${gv})");

						foreach( $fields_uuid as $field )
							$st_records_ins->bindParam(":${field}", $$field, SQLITE3_BLOB);

						foreach( $fields as $field )
							$st_records_ins->bindParam(":${field}", $$field);

					}

					$st_records_ins->execute();

				}

			// addition existing records to totals
			if( $st_totals_add === null ) {

				$st_totals_add = $this->infobase_->prepare(str_replace('${op}', '+', $st_totals_op));
				$st_totals_add->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

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

	    error_log(sprintf('%u', $cnt) . ' reserves updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>