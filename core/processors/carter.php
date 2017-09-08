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
	protected $session_uuid_;

	protected function fetch_cart() {

		$sql = <<<EOT
			SELECT
				b.product_uuid					AS uuid,
				b.quantity						AS buy_quantity,
				a.code							AS code,
				a.name							AS name,
				i.uuid							AS base_image_uuid,
				i.ext							AS base_image_ext,
				COALESCE(q.quantity, 0)			AS remainder,
				COALESCE(b.price, p.price, 0)	AS price,
				COALESCE(r.quantity, 0)			AS reserve,
				bcr.barcode						AS barcode
			FROM
				cart AS b
					LEFT JOIN products AS a
          			ON a.uuid = b.product_uuid
					LEFT JOIN images AS i
					ON a.base_image_uuid = i.uuid
					LEFT JOIN prices_registry AS p
					ON a.uuid = p.product_uuid
					LEFT JOIN remainders_registry AS q
					ON a.uuid = q.product_uuid
					LEFT JOIN reserves_registry AS r
					ON a.uuid = r.product_uuid
					LEFT JOIN barcodes_registry AS bcr
					ON a.uuid = bcr.product_uuid
     		WHERE
				b.session_uuid = :session_uuid
			ORDER BY
				a.name
EOT
		;

		$st = $this->infobase_->prepare($sql);
		$st->bindValue(':session_uuid', $this->session_uuid_, SQLITE3_BLOB);
		$result = $st->execute();

		$cart = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$uuid = bin2uuid($uuid);

			$barcodes = @$cart[$uuid]['barcodes'];

			if( $barcode !== null ) {
				if( $barcodes === null )
					$barcodes = [];
				$barcodes[] = $barcode;
			}

			$e = [
				'uuid'			=> $uuid,
				'buy_quantity'	=> $buy_quantity,
				'code'			=> $code,
				'name'			=> htmlspecialchars($name, ENT_HTML5),
				'price'			=> $price,
				'remainder'		=> $remainder,
				'reserve'		=> $reserve,
				'img_url'		=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext, true), ENT_HTML5),
				'img_ico'		=> htmlspecialchars(get_image_url($base_image_uuid, $base_image_ext, false), ENT_HTML5)
			];

			if( $barcodes !== null )
				$e['barcodes'] = $barcodes;

			if( $base_image_uuid !== null )
				$e['img_uuid'] = bin2uuid($base_image_uuid);

			$cart[$uuid] = $e;

		}

		return array_values($cart);

	}

	protected function fetch_constants($bin2uuid = false) {

		$constants = [
			'ТекущийМагазинАдрес'			=> null,
			'ТекущийМагазинПредставление'	=> null,
			'exchange_node'					=> null,
			'exchange_node_name'			=> null,
			'exchange_url'					=> null,
			'exchange_user'					=> null,
			'exchange_pass'					=> null
		];

		extract($constants);

		$in = '\'' . implode('\', \'', array_keys($constants)) . '\'';

		$sql = <<<EOT
			SELECT
				name							AS name,
				value_type						AS value_type,
				COALESCE(value_uuid, value_s)	AS value
			FROM
				constants
			WHERE
				name IN (${in})
EOT
		;

		$this->infobase_->dump_plan($sql);

		$result = $this->infobase_->query($sql);

		$a = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			if( $bin2uuid && $value_type === 4 )
				$a[$name] = bin2uuid(@$value);
			else
				$a[$name] = $value;

		}

		return $a;

	}

	protected function handle_order(&$order) {

		extract($this->fetch_constants());

		$order_request = [ 'exchange_node' => bin2uuid($exchange_node) ];
		$order_products = [];

		foreach( $order as $e ) {

			extract($e);

			$order_products[] = [
				'product'	=> $uuid,
				'price'		=> $price,
				'quantity'	=> $quantity
			];

		}

		$order_request['products'] = $order_products;

		if( @$this->request_['paper'] !== null )
			$order_request['paper'] = true;

		$data = request_exchange_node($exchange_url . '/order', $exchange_user, $exchange_pass, $order_request);
		$data['name'] = $exchange_node_name;
		//$data['barcode_eangnivc'] = htmlspecialchars($data['barcode_eangnivc'], ENT_HTML5);

		$this->response_['order'] = $data;

		if( @$this->request_['paper'] !== null ) {
			$orders = @$_SESSION['ORDERS'];

			if( $orders === null )
				$orders = [];
			else
				$orders = unserialize(bzdecompress(base64_decode($orders)));

			$orders[$data['uuid']] = $data;
			$_SESSION['ORDERS'] = base64_encode(bzcompress(serialize($orders), 9));
		}
	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->session_uuid_ = session_startup();
		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract($this->request_);

		$this->infobase_->begin_transaction();

		if( @$order !== null )
			$this->handle_order($order);

		if( @$products !== null && count($products) > 0
			&& @$order['availability'] === null ) {

			$timer->restart();

			$sql = <<<'EOT'
				REPLACE INTO cart
				SELECT
					n.session_uuid,
					n.product_uuid,
					n.quantity,
					COALESCE(n.price, b.price) AS price
				FROM
					(SELECT
						:session_uuid	AS session_uuid,
						:product_uuid	AS product_uuid,
						:quantity		AS quantity,
						:price			AS price
					) AS n
						LEFT JOIN cart AS b
						ON n.session_uuid = b.session_uuid
							AND n.product_uuid = b.product_uuid
EOT
			;

			$st = $this->infobase_->prepare($sql);
			$st->bindParam(':session_uuid', $this->session_uuid_, SQLITE3_BLOB);

			$sql = <<<'EOT'
				SELECT
					a.product_uuid,
					COALESCE(b.quantity, 0) + 1 AS quantity
				FROM
					barcodes_registry AS a
						LEFT JOIN cart AS b
						ON b.session_uuid = :session_uuid
							AND a.product_uuid = b.product_uuid
				WHERE
					a.barcode = :barcode
EOT
			;

			$st_barcode = $this->infobase_->prepare($sql);
			$st_barcode->bindParam(':session_uuid', $this->session_uuid_, SQLITE3_BLOB);

			foreach( $products as $product ) {

				extract($product);

				$product_uuid = uuid2bin(@$uuid);

				if( @$barcode !== null ) {
					$st_barcode->bindValue(':barcode', $barcode);
					$result = $st_barcode->execute();

					while( $r = $result->fetchArray(SQLITE3_ASSOC) )
						extract($r);
				}

				if( $product_uuid !== null ) {
					$st->bindValue(':product_uuid'	, $product_uuid, SQLITE3_BLOB);
					$st->bindValue(':quantity'		, @$quantity);
					$st->bindValue(':price'			, @$price);
					$st->execute();
				}

			}

			$sql = <<<'EOT'
				REPLACE INTO cart
				SELECT
					c.session_uuid,
					c.product_uuid,
					q.quantity,
					c.price
				FROM
					cart AS c
					INNER JOIN remainders_registry AS q
					ON c.product_uuid = q.product_uuid
				WHERE
					c.session_uuid = :session_uuid
					AND c.quantity > q.quantity
EOT
			;

			$st = $this->infobase_->prepare($sql);
			$st->bindValue(':session_uuid', $this->session_uuid_, SQLITE3_BLOB);
			$st->execute();

			$sql = <<<'EOT'
				DELETE FROM cart WHERE session_uuid = :session_uuid AND quantity <= 0
EOT
			;

			$st = $this->infobase_->prepare($sql);
			$st->bindValue(':session_uuid', $this->session_uuid_, SQLITE3_BLOB);
			$st->execute();

			if( config::$cart_timing ) {

				$ellapsed = $timer->last_nano_time();
		    	error_log('cart update, ellapsed: ' . $timer->ellapsed_string($ellapsed));

			}

		}
		else {
			$c = $this->fetch_constants();

			$this->response_['constants'] = [
				'ТекущийМагазинАдрес'			=> $c['ТекущийМагазинАдрес'],
				'ТекущийМагазинПредставление'	=> $c['ТекущийМагазинПредставление']
			];
		}

		$timer->restart();

		$this->response_['cart'] = $this->fetch_cart();

		if( config::$cart_timing ) {

			$ellapsed = $timer->last_nano_time();
	    	error_log('cart fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		$this->infobase_->commit_transaction();

		if( @$orders !== null ) {
			$orders = @$_SESSION['ORDERS'];

			if( $orders === null )
				$orders = [];
			else
				$orders = unserialize(bzdecompress(base64_decode($orders)));

			$this->response_['orders'] = $orders;
		}

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('cart retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
