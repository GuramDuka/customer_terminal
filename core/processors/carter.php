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
class carter_handler extends handler {

	protected $infobase_;

	protected function handle_request() {

		$start_time = micro_time();

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract(get_object_vars($this->request_));

		$this->infobase_->exec('BEGIN TRANSACTION');

		if( @$products !== null && count($products) > 0 ) {

			$start_time_st = micro_time();

			foreach( $products as $product ) {

				extract(get_object_vars($product));

				$product_uuid = uuid2bin($uuid);

				$sql = <<<'EOT'
					REPLACE INTO cart (product_uuid, quantity) VALUES (:uuid, :quantity)
EOT
				;

				$st = $this->infobase_->prepare($sql);
				$st->bindValue(':uuid'		, $product_uuid, SQLITE3_BLOB);
				$st->bindValue(':quantity'	, $quantity);
				$st->execute();

			}

			$sql = <<<'EOT'
				REPLACE INTO cart
				SELECT
					c.product_uuid,
					q.quantity
				FROM
					cart AS c
					INNER JOIN remainders_registry AS q
					ON c.product_uuid = q.product_uuid
				WHERE
					c.quantity > q.quantity
EOT
			;

			$this->infobase_->dump_plan($sql);

			$this->infobase_->exec($sql);

			$sql = <<<'EOT'
				DELETE FROM cart WHERE quantity <= 0 OR quantity IS NULL
EOT
			;

			$this->infobase_->dump_plan($sql);

			$this->infobase_->exec($sql);

			if( config::$cart_timing ) {

				$finish_time = micro_time();
				$ellapsed_ms = bcsub($finish_time, $start_time_st);
				$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);

		    	error_log('cart update, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

			}

		}

		$sql = <<<EOT
			SELECT
				a.uuid					AS uuid,
				b.quantity				AS buy_quantity,
				a.code					AS code,
				a.name					AS name,
				i.uuid					AS base_image_uuid,
				i.ext					AS base_image_ext,
				q.quantity				AS remainder,
				p.price					AS price,
				COALESCE(r.quantity, 0)	AS reserve
			FROM
					products AS a
					INNER JOIN images AS i
					ON a.base_image_uuid = i.uuid
					INNER JOIN prices_registry AS p
					ON a.uuid = p.product_uuid
					INNER JOIN remainders_registry AS q
					ON a.uuid = q.product_uuid
					LEFT JOIN reserves_registry AS r
					ON a.uuid = r.product_uuid
          			INNER JOIN cart AS b
          			ON a.uuid = b.product_uuid
     		WHERE
				a.uuid IN (select product_uuid FROM cart)
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
				'buy_quantity'	=> $buy_quantity,
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

		$this->response_['ellapsed'] = $ellapsed_ms;

		if( config::$log_timing )
		    error_log('cart retrieved, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
