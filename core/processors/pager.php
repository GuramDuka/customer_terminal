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
class pager_handler extends handler {

	protected $infobase_;

	protected function handle_request() {

		$start_time = micro_time();

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		$pgsz = config::$page_size;

		extract(get_object_vars($this->request_));

		$this->infobase_->exec('BEGIN TRANSACTION');

		$category_table = 'products_' . uuid2table_name($category) . 'pages';

		$sql = <<<EOT
			SELECT
				${order}_${direction}_uuid				AS uuid,
				${order}_${direction}_code				AS code,
				${order}_${direction}_name				AS name,
				${order}_${direction}_base_image_uuid	AS base_image_uuid,
				${order}_${direction}_base_image_ext	AS base_image_ext,
				${order}_${direction}_price				AS price,
				${order}_${direction}_remainder			AS remainder,
				${order}_${direction}_reserve			AS reserve
			FROM
				${category_table}
			WHERE
				pgnon BETWEEN :pgnon0 AND :pgnon1
			ORDER BY
				pgnon
EOT
		;

		$this->infobase_->dump_plan($sql);

		$start_time_st = micro_time();

		$st = $this->infobase_->prepare($sql);
		$st->bindValue(':pgnon0', $pgno << 4);
		$st->bindValue(':pgnon1', ($pgno << 4) + ((1 << 4) - 1));

		$result = $st->execute();

		if( config::$pager_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time_st);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

	    	error_log('page fetch, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

		$page = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$page[] = [
				'uuid'		=> bin2uuid($uuid),
				'code'		=> $code,
				'name'		=> htmlspecialchars($name, ENT_HTML5),
				'price'		=> $price,
				'remainder'	=> $remainder,
				'reserve'	=> $reserve,
				'img_url'	=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext), ENT_HTML5)
			];

		}

		$this->response_['products'] = $page;

		$r = $this->infobase_->query("SELECT max(pgnon) FROM ${category_table}");
		list($pgnon) = $r->fetchArray(SQLITE3_NUM);
		$this->response_['pages'] = $r ? ($pgnon >> 4) + 1 : 0;
		$this->response_['page_size'] = config::$page_size;

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_s = ellapsed_time_string($ellapsed_ms);

		$this->response_['ellapsed'] = $ellapsed_s;

		if( config::$log_timing )
		    error_log('page retrieved, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		// no-cache
		//header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0'); 
		//header('Expires: ' . date("r"));
		//header('Expires: -1', false);

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
