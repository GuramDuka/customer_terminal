<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class cars_selections_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'car_uuid', 'category_uuid', 'idx' ];
		$dimensions = array_merge($all_fields, []);

		for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ )
			$all_fields[] = "value${i}_uuid";

		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$this->infobase_->begin_immediate_transaction();

		$begin_start_time = $start_time = micro_time();

		$st = null;
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

				$st_erase = null;
				$where = $w;
				$w = null;

			}

			if( $st_erase === null ) {

				$sql = <<<EOT
					DELETE FROM
						cars_selections_registry
					WHERE
						1
						${where}
EOT
				;

				$this->infobase_->dump_plan($sql);

				$st_erase = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					if( substr($field, -4) === 'uuid' )
						$st_erase->bindParam(":${field}", $$field, SQLITE3_BLOB);
					else
						$st_erase->bindParam(":${field}", $$field);

			}

			$st_erase->execute();

			if( @$recordset === null )
				continue;

			foreach( $recordset as $record ) {

				// object may not present all fields then need initialize
				foreach( $all_fields as $field )
					$$field = null;

				extract($record);

				foreach( $fields_uuid as $field )
					$$field = uuid2bin(@$$field);

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("INSERT INTO cars_selections_registry (${gf}) VALUES (:${gv})");

					foreach( $fields_uuid as $field )
						$st->bindParam(":${field}", $$field, SQLITE3_BLOB);

					foreach( $fields as $field )
						$st->bindParam(":${field}", $$field);

				}

				$st->execute();

			}

			if( bccomp(bcsub(micro_time(), $begin_start_time), config::$sqlite_tx_duration) >= 0 ) {

				$this->infobase_->commit_immediate_transaction();
				$this->infobase_->begin_immediate_transaction();
				$begin_start_time = micro_time();

			}

		}

		$this->infobase_->commit_immediate_transaction();

		if( config::$log_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
			$cnt = count($this->objects_);
			$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' cars selections registry updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
