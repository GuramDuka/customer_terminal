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

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		$pgsz = config::$page_size;

		extract($this->request_);

		$this->infobase_->begin_immediate_transaction();

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

		$timer->restart();

		$st = $this->infobase_->prepare($sql);
		$st->bindValue(':pgnon0', $pgno << 4);
		$st->bindValue(':pgnon1', ($pgno << 4) + ((1 << 4) - 1));

		$result = $st->execute();

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

		if( config::$pager_timing ) {

			$ellapsed = $timer->last_nano_time();
	    	error_log('page fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		$r = $this->infobase_->query("SELECT max(pgnon) FROM ${category_table}");
		list($pgnon) = $r->fetchArray(SQLITE3_NUM);
		$this->response_['pages'] = $r ? ($pgnon >> 4) + 1 : 0;
		$this->response_['page_size'] = config::$page_size;

		$this->infobase_->commit_immediate_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('page retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

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
