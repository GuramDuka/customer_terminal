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
			'storage_uuid'
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

		$this->infobase_->begin_transaction();

		$timer = new \nano_timer;

		$st_records_ins = null;
		$st_records_del = null;
		$st_totals_add = null;
		$st_totals_sub = null;
		$st_totals_del = null;

		$st_totals_op = <<<'EOT'
			REPLACE INTO
				system_remainders_registry
			SELECT
				r.shop_uuid,
				r.product_uuid,
				SUM((COALESCE(t.remainder_quantity, 0) * 1000 ${op} r.remainder_quantity * 1000) / 1000),
				SUM((COALESCE(t.reserve_quantity, 0) * 1000 ${op} r.reserve_quantity * 1000) / 1000)
			FROM
				system_remainders_records_registry AS r
				LEFT JOIN system_remainders_registry AS t
				ON r.shop_uuid = t.shop_uuid
					AND r.product_uuid = t.product_uuid
			WHERE
				1
EOT
		;

		$st_totals_op_grp = <<<'EOT'
			GROUP BY
				r.shop_uuid,
				r.product_uuid
EOT
		;

		$where = null;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			$w = '';

			foreach( $dimensions as $dim ) {

				if( $$dim === null )
					continue;

				$w .= " AND ${dim} = :${dim}";

			}

			if( $w !== $where ) {

				$st_records_del = null;
				$st_totals_add = null;
				$st_totals_sub = null;
				$st_totals_del = null;
				$where = $w;
				$w = null;

			}

			// subtract existing records from totals
			if( $st_totals_sub === null ) {

				$sql = str_replace('${op}', '-', $st_totals_op . str_replace('AND ', 'AND r.', "${where}") . $st_totals_op_grp);

				$this->infobase_->dump_plan($sql);
				$st_totals_sub = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					$st_totals_sub->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_totals_sub->execute();

			if( $st_totals_del === null ) {

				$sql = <<<EOT
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
				;

				$this->infobase_->dump_plan($sql);
				$st_totals_del = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					$st_totals_del->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_totals_del->execute();

			if( $st_records_del === null ) {

				$sql = <<<EOT
					DELETE FROM
						system_remainders_records_registry
					WHERE
						1
						${where}
EOT
				;

				$this->infobase_->dump_plan($sql);
				$st_records_del = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					$st_records_del->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_records_del->execute();

			if( @$recordset !== null )
				foreach( $recordset as $record ) {

					// object may not present all fields then need initialize
					foreach( $all_fields as $field )
						$$field = null;

					extract($record);

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

				$sql = str_replace('${op}', '+', $st_totals_op . str_replace('AND ', 'AND r.', "${where}") . $st_totals_op_grp);

				$this->infobase_->dump_plan($sql);
				$st_totals_add = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					$st_totals_add->bindParam(":${field}", $$field, SQLITE3_BLOB);

			}

			$st_totals_add->execute();

			// slow update on big recordsets, disable restart tx
			$this->infobase_->sqlite_tx_duration($timer, __FILE__, __LINE__);

		}

		$entity = $this->infobase_->escapeString('products_pages');
		$this->infobase_->exec("REPLACE INTO dirties (entity) VALUES ('${entity}')");

		$this->infobase_->commit_transaction();

		if( config::$analyze_sqlite_tables ) {

			$this->infobase_->exec('ANALYZE system_remainders_records_registry');
			$this->infobase_->exec('ANALYZE system_remainders_registry');

		}

		if( config::$log_timing ) {

			list($ellapsed, $seconds) = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

		    error_log(sprintf('%u', $cnt) . ' system remainders registry updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
