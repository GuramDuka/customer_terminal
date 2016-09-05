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
class by_car_selectorer_handler extends handler {

	protected $infobase_;

	protected function fetch_setup() {

		extract($this->request_);

		$category_uuid = uuid2bin($category);
	
		$manufacturer_uuid	= uuid2bin(@$manufacturer);
		$model_uuid			= uuid2bin(@$model);
		$modification_uuid	= uuid2bin(@$modification);
		$year_uuid			= uuid2bin(@$year);

		$sql = <<<'EOT'
			WITH cte AS (
				SELECT
					car_group_uuid
				FROM
					products_selection_by_car_setup_registry
				WHERE
					category_uuid = :category_uuid
				LIMIT
					1
			)
EOT
		;

		$car = @$manufacturer !== null && @$model !== null && @$modification !== null && @$year !== null;

		if( $car ) {

			$sql .= <<<EOT
				SELECT
					c.uuid
				FROM
					cte AS g
						INNER JOIN cars AS c
						ON g.car_group_uuid = c.parent_uuid
							AND c.manufacturer_uuid	= :manufacturer_uuid
							AND c.model_uuid		= :model_uuid
							AND c.modification_uuid	= :modification_uuid
							AND c.year_uuid			= :year_uuid
EOT
			;

		}
		else {

			$cmanufacturer	= @$manufacturer	!== null ? 'AND c.manufacturer_uuid = :manufacturer_uuid' : '';
			$cmodel			= @$model			!== null ? 'AND c.model_uuid = :model_uuid' : '';
			$cmodification	= @$modification	!== null ? 'AND c.modification_uuid = :modification_uuid' : '';

			$v = @$manufacturer === null ? 'manufacturer' :
					(@$model === null ? 'model' :
						(@$modification === null ? 'modification' : 'year'));

			$sql .= <<<EOT
				SELECT DISTINCT
					v.uuid										AS value_uuid,
					v.value_type								AS value_type,
					COALESCE(v.value_b, v.value_n, v.value_s)	AS value
				FROM
					cte AS g
						INNER JOIN cars AS c
						ON g.car_group_uuid = c.parent_uuid
							${cmanufacturer}
							${cmodel}
							${cmodification}
						INNER JOIN properties_values AS v
						ON c.${v}_uuid = v.uuid
				WHERE
					NOT c.marked
EOT
			;

		}
	
		$this->infobase_->dump_plan($sql);
	
		$st = $this->infobase_->prepare($sql);
		$st->bindParam(':category_uuid'		, $category_uuid	, SQLITE3_BLOB);
		$st->bindParam(':manufacturer_uuid'	, $manufacturer_uuid, SQLITE3_BLOB);
		$st->bindParam(':model_uuid'		, $model_uuid		, SQLITE3_BLOB);
		$st->bindParam(':modification_uuid'	, $modification_uuid, SQLITE3_BLOB);
		$st->bindParam(':year_uuid'			, $year_uuid		, SQLITE3_BLOB);

		$result = $st->execute();
		$values = [];

		if( $car ) {

			$r = $result->fetchArray(SQLITE3_ASSOC);
			$this->response_['car'] = bin2uuid($r['uuid']);

		}
		else {

			while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

				extract($r);

				$value_uuid	= bin2uuid($value_uuid);

				$values[] = [
					'uuid'			=> $value_uuid,
					'value_type'	=> $value_type,
					'value'			=> is_string($value) ? htmlspecialchars($value, ENT_HTML5) :
									($value_type === 1 ? $value !== 0 : $value),
					'raw'			=> $value
				];

			}

			usort($values, function($n0, $n1) {

				$r = null;

				$a = $n0['raw'];
				$b = $n1['raw'];

				if( is_numeric($a) && is_numeric($b) ) {

					$x = floatval($a) == intval($a) ? intval($a) : floatval($a);
					$y = floatval($b) == intval($b) ? intval($b) : floatval($b);

					// in php operator ? has a priority different from C or C++, so parentheses are necessary
					$r = $x < $y ? -1 : ($x > $y ? 1 : 0);

				}
				else if( is_string($a) && is_string($b) ) {

					$r = strcmp(mb_strtoupper($a), mb_strtoupper($b));

				}
				else {

					$r = strcmp(mb_strtoupper(strval($a)), mb_strtoupper(strval($b)));

				}

				return $r;

			});

		}

		$this->response_['values'] = $values;

	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract($this->request_);

		$this->infobase_->begin_transaction();

		if( @$category !== null ) {

			$this->fetch_setup();

			if( config::$log_timing ) {

				$ellapsed = $timer->last_nano_time();
	    		error_log('by car selections setup fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

			}

		}

		$this->infobase_->commit_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('by car selection retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
