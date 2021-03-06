<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class prices_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'recorder_uuid', 'product_uuid', 'period', 'price' ];
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$event = [];

		$this->infobase_->begin_transaction();

		$timer = new \nano_timer;

		$st_records_ins = null;
		$st_records_del = null;
		$st_records_sel = null;

		$st_totals_add = null;
		$st_totals_sub = null;
		$st_totals_del = null;

		$st_totals_op = <<<'EOT'
			REPLACE INTO
				prices_registry
			SELECT
				r.product_uuid,
				CASE
					WHEN t.period IS NULL OR t.period <= r.period THEN
						r.period
					ELSE
						t.period
				END AS period,
				COALESCE(t.ref_count, 0) ${op} 1 AS ref_count,
				CASE
					WHEN t.period IS NULL OR t.period <= r.period THEN
						r.price
					ELSE
						t.price
				END AS price
			FROM
				prices_records_registry AS r
				LEFT JOIN prices_registry AS t
				ON r.product_uuid = t.product_uuid
			WHERE
				r.recorder_uuid = :recorder_uuid
EOT
		;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

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
						prices_registry
					WHERE
						product_uuid IN (
							SELECT
								product_uuid
							FROM
								prices_records_registry
							WHERE
								recorder_uuid = :recorder_uuid
						)
						AND ref_count = 0
EOT
				);

				$st_totals_del->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

			}

			$st_totals_del->execute();

			if( $st_records_sel === null ) {

				$st_records_sel = $this->infobase_->prepare(<<<'EOT'
					SELECT DISTINCT
						product_uuid
					FROM
						prices_records_registry
					WHERE
						recorder_uuid = :recorder_uuid
EOT
				);

				$st_records_sel->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

			}

			$result = $st_records_sel->execute();

			while( ($record = $result->fetchArray(SQLITE3_NUM)) )
				$event[bin2uuid($record[0])] = null;

			if( $st_records_del === null ) {

				$st_records_del = $this->infobase_->prepare(<<<'EOT'
					DELETE FROM
						prices_records_registry
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

					extract($record);

					$event[$product_uuid] = null;

					foreach( $fields_uuid as $field )
						$$field = uuid2bin(@$$field);

					if( $st_records_ins === null ) {

						$gf = implode(', ', $all_fields);
						$gv = implode(', :', $all_fields);

						$st_records_ins = $this->infobase_->prepare("INSERT INTO prices_records_registry (${gf}) VALUES (:${gv})");

						foreach( $fields_uuid as $field )
							$st_records_ins->bindParam(":${field}", $$field, SQLITE3_BLOB);

						foreach( $fields as $field )
							$st_records_ins->bindParam(":${field}", $$field);

					}

					$st_records_ins->execute();

				}

			if( $st_totals_add === null ) {

				$st_totals_add = $this->infobase_->prepare(str_replace('${op}', '+', $st_totals_op));
				$st_totals_add->bindParam(':recorder_uuid', $recorder_uuid, SQLITE3_BLOB);

			}

			$st_totals_add->execute();

			$this->infobase_->sqlite_tx_duration($timer, __FILE__, __LINE__);

		}

		$entity = $this->infobase_->escapeString('products_pages');
		$this->infobase_->exec("REPLACE INTO dirties (entity) VALUES ('${entity}')");

		$this->infobase_->commit_transaction();

		if( config::$analyze_sqlite_tables ) {

			$this->infobase_->exec('ANALYZE prices_records_registry');
			$this->infobase_->exec('ANALYZE prices_registry');

		}

		if( config::$log_timing ) {

			[ $ellapsed, $seconds ] = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' prices registry updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		$timer->start();

		$trigger = new \events_trigger;
		$trigger->event([ 'prices' => array_keys($event) ]);
		$trigger->fire();

		if( config::$log_trigger_timing ) {

			[ $ellapsed ] = $timer->nano_time();
    		error_log('prices trigger fired, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
