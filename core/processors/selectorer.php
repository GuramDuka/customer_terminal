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
class selectorer_handler extends handler {

	protected $infobase_;

	protected function fetch_setup() {

		extract($this->request_);

		$category_uuid = uuid2bin($category);
		$category_table = 'products_' . uuid2table_name($category) . 'pages';
		$table_version = $this->infobase_->products_pages_version($category_table);
		$category_table .= '_v' . $table_version;

		$pgnon = get_pgnon(0, 0, -1, -1);

		$sql = <<<EOT
			WITH cte AS (
				SELECT DISTINCT
					property_uuid,
					display,
					display_order,
					columns,
					multi_select
				FROM
					products_selection_by_properties_setup_registry
				WHERE
					category_uuid = :category_uuid
			),
			ctep AS (
				SELECT
					p.uuid AS object_uuid
				FROM
					${category_table} AS p
				WHERE
					p.pgnon BETWEEN 0 AND ${pgnon}
			),
			cte0 AS (
				SELECT
					p.object_uuid,
					c.property_uuid,
					c.display,
					c.display_order,
					c.columns,
					c.multi_select
				FROM
					ctep AS p
						INNER JOIN cte AS c
						ON 1
			),
			cte2 AS (
				SELECT DISTINCT
					p.property_uuid,
					p.display,
					p.display_order,
					p.columns,
					p.multi_select,
					r.value_uuid
				FROM
					cte0 AS p
						INNER JOIN properties_registry AS r
						ON p.object_uuid = r.object_uuid
							AND p.property_uuid = r.property_uuid
			)

			SELECT
				r.property_uuid								AS property_uuid,
				r.display									AS display,
				r.display_order								AS display_order,
				r.columns									AS columns,
				r.multi_select								AS multi_select,
				v.uuid										AS value_uuid,
				v.value_type								AS value_type,
				COALESCE(v.value_b, v.value_n, v.value_s)	AS value
			FROM
				cte2 AS r
					INNER JOIN properties_values AS v
					ON r.property_uuid = v.property_uuid
						AND r.value_uuid = v.uuid

			ORDER BY
				r.display_order, r.display
EOT
		;

		$this->infobase_->dump_plan($sql);

		$st = $this->infobase_->prepare($sql);
		$st->bindParam(':category_uuid', $category_uuid, SQLITE3_BLOB);

		$result = $st->execute();
		$map = [];
		$setup = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$property_uuid	= bin2uuid($property_uuid);
			$value_uuid		= bin2uuid($value_uuid);

			$idx = @$map[$property_uuid];

			if( $idx === null ) {

				$idx = $map[$property_uuid] = count($map);

				$setup[$idx] = [
					'uuid'			=> $property_uuid,
					'display'		=> htmlspecialchars($display, ENT_HTML5),
					'columns'		=> $columns,
					'multi_select'	=> $multi_select !== 0,
					'values'		=> []
				];

			}

			$setup[$idx]['values'][] = [
				'uuid'			=> $value_uuid,
				'value_type'	=> $value_type,
				'value'			=> is_string($value) ? htmlspecialchars($value, ENT_HTML5) :
									($value_type === 1 ? $value !== 0 : $value),
				'raw'			=> $value
			];

		}

		// sorting
		foreach( $setup as $k => $v ) {

			$ar = $v['values'];

			usort($ar, function($n0, $n1) {

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

			$setup[$k]['values'] = $ar;

		}

		$this->response_['setup'] = $setup;

	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract($this->request_);

		$this->infobase_->begin_transaction();

		if( @$setup !== null ) {

			$this->fetch_setup();

			if( config::$log_timing ) {

				$ellapsed = $timer->last_nano_time();
	    		error_log('selections setup fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

			}

		}

		$this->infobase_->commit_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('selections retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
