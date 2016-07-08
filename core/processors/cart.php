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
class cart_handler extends handler {

	protected $infobase_;

	protected function handle_request() {

		$start_time = micro_time();

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract(get_object_vars($this->request_));

		$this->infobase_->exec('BEGIN TRANSACTION');

		if( @$buy_product !== null ) {

			$buy_product_uuid = uuid2bin($buy_product);

			$sql = 'REPLACE INTO cart (uuid, quantity) VALUES (:uuid, :quantity)';

			$this->infobase_->dump_plan($sql);

			$start_time_st = micro_time();

			$st = $this->infobase_->prepare($sql);
			$st->bindValue(':uuid'		, $buy_product_uuid);
			$st->bindValue(':quantity'	, $buy_quantity);
			$st->execute();

			if( config::$cart_timing ) {

				$finish_time = micro_time();
				$ellapsed_ms = bcsub($finish_time, $start_time_st);
				$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

		    	error_log('cart update, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

			}

		}

		$sql = <<<EOT
			SELECT
				b.uuid					AS uuid,
				b.quantity				AS buy_quantity,
				a.code					AS code,
				a.name					AS name,
				a.base_image_uuid		AS base_image_uuid,
				i.ext					AS base_image_ext,
				q.quantity				AS remainder,
				p.price					AS price,
				COALESCE(r.quantity, 0)	AS reserve
			FROM
				cart AS b
					INNER JOIN products AS a
					ON b.uuid = a.uuid
					INNER JOIN images AS i
					ON a.base_image_uuid = i.uuid
					INNER JOIN prices_registry AS p
					ON a.uuid = p.product_uuid
					INNER JOIN remainders_registry AS q
					ON a.uuid = q.product_uuid
					LEFT JOIN reserves_registry AS r
					ON a.uuid = r.product_uuid
			ORDER BY
				a.name
EOT
		;

		$this->infobase_->dump_plan($sql);

		$start_time_st = micro_time();

		$result = $this->infobase_->query($sql);

		$cart = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$cart[] = [
				'uuid'			=> bin2uuid($uuid),
				'buy_quantity'	=> $quantity,
				'code'			=> $code,
				'name'			=> htmlspecialchars($name, ENT_HTML5),
				'price'			=> $price,
				'remainder'		=> $remainder,
				'reserve'		=> $reserve,
				'img_url'		=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext), ENT_HTML5)
			];

		}

		$this->response_['cart'] = $cart;

		if( config::$cart_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time_st);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

	    	error_log('cart fetch, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_s = ellapsed_time_string($ellapsed_ms);

		$this->response_['ellapsed'] = $ellapsed_s;

		if( config::$log_timing )
		    error_log('cart retrieved, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
