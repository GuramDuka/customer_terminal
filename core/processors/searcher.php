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
class searcher_handler extends handler {

	protected $infobase_;

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		$page = [];

		extract($this->request_);

		$this->infobase_->begin_transaction();

		$fts_filter = trim(@$fts_filter);

		if( mb_strlen($fts_filter) < 1 )
			$fts_filter = null;

		if( $fts_filter !== null && @$view === 'products' ) {

			$filter = $this->infobase_->escapeString(transform_fts_filter($fts_filter));
			$raw_filter = $this->infobase_->escapeString($fts_filter);

			$sql = <<<EOT
				SELECT
					MAX(a.rowid),
					a.uuid
				FROM
					products_fts AS a
				WHERE
					-- TODO: for sqlite 3.20 -> products_fts MATCH '(name : (${filter})) OR (barcode : ("${raw_filter}"))'
					products_fts MATCH '(name : ${filter}) OR (barcode : "${raw_filter}")'
				GROUP BY
       				uuid
EOT
			;

			$sql = <<<EOT
				WITH fts_filter AS (
					${sql}
				)
				SELECT DISTINCT
					a.uuid					AS uuid,
					a.code					AS code,
					a.name					AS name,
					i.uuid					AS base_image_uuid,
					i.ext					AS base_image_ext,
					COALESCE(q.quantity, 0)	AS remainder,
					COALESCE(p.price, 0)	AS price,
					COALESCE(r.quantity, 0)	AS reserve
				FROM
					products AS a
						INNER JOIN fts_filter AS f
						ON a.uuid = f.uuid
						LEFT JOIN images AS i
						ON a.base_image_uuid = i.uuid
						LEFT JOIN prices_registry AS p
						ON a.uuid = p.product_uuid
						INNER JOIN remainders_registry AS q
						ON a.uuid = q.product_uuid
						LEFT JOIN reserves_registry AS r
						ON a.uuid = r.product_uuid
				WHERE
					COALESCE(q.quantity, 0) > 0
				ORDER BY
					a.name
				LIMIT 250 OFFSET 0
EOT
			;

			$this->infobase_->dump_plan($sql);

			$timer->restart();

			$st = $this->infobase_->prepare($sql);
			$result = $st->execute();

			while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

				extract($r);

				$e = [
					'uuid'		=> bin2uuid($uuid),
					'code'		=> $code,
					'name'		=> htmlspecialchars($name, ENT_HTML5),
					'price'		=> $price,
					'remainder'	=> $remainder,
					'reserve'	=> $reserve,
					'img_url'	=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext, true), ENT_HTML5),
					'img_ico'	=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext, false), ENT_HTML5)
				];

				if( $base_image_uuid !== null )
					$e['img_uuid'] = bin2uuid($base_image_uuid);

				$page[] = $e;

			}

		}

		$this->response_['products'] = $page;

		$page = [];

		if( $fts_filter !== null && @$view === 'customers' ) {

			$filter = $this->infobase_->escapeString(transform_fts_filter($fts_filter));
			$raw_filter = $this->infobase_->escapeString($fts_filter);

			$sql = <<<EOT
				SELECT
					MAX(a.rowid),
					a.uuid
				FROM
					customers_fts AS a
				WHERE
					-- TODO: for sqlite 3.20 -> customers_fts MATCH '({name description} : (${filter})) OR (inn : ("${raw_filter}"))'
					customers_fts MATCH '({name description} : ${filter}) OR (inn : "${raw_filter}")'
				GROUP BY
       				uuid
EOT
			;

			$sql = <<<EOT
				WITH fts_filter AS (
					${sql}
				)
				SELECT DISTINCT
					a.uuid,
					a.code,
					a.name,
					a.inn,
					a.description
				FROM
					customers AS a
						INNER JOIN fts_filter AS f
						ON a.uuid = f.uuid
				ORDER BY
					a.name
				LIMIT 250 OFFSET 0
EOT
			;

			$this->infobase_->dump_plan($sql);

			$timer->restart();

			$st = $this->infobase_->prepare($sql);
			$result = $st->execute();

			while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

				extract($r);

				$page[] = [
					'uuid'			=> bin2uuid($uuid),
					'code'			=> $code,
					'name'			=> htmlspecialchars($name, ENT_HTML5),
					'inn'			=> htmlspecialchars($inn, ENT_HTML5),
					'description'	=> htmlspecialchars($description, ENT_HTML5),
				];

			}

		}

		$this->response_['customers'] = $page;

		$this->infobase_->commit_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('search finished, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
