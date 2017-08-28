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

	protected function fetch_cart() {

		$sql = <<<EOT
			SELECT
				b.product_uuid			AS uuid,
				b.quantity				AS buy_quantity,
				a.code					AS code,
				a.name					AS name,
				i.uuid					AS base_image_uuid,
				i.ext					AS base_image_ext,
				COALESCE(q.quantity, 0)	AS remainder,
				COALESCE(p.price, 0)	AS price,
				COALESCE(r.quantity, 0)	AS reserve,
				bcr.barcode				AS barcode
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
		$st->bindValue(':session_uuid', @$_SESSION['DATA_ID'], SQLITE3_BLOB);
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

	protected function handle_order(&$order) {

		$constants = [
			'exchange_node'			=> null,
			'exchange_node_name'	=> null,
			'exchange_url'			=> null,
			'exchange_user'			=> null,
			'exchange_pass'			=> null
		];

		extract($constants);

		$in = '\'' . implode('\', \'', array_keys($constants)) . '\'';

		$sql = <<<EOT
			SELECT
				name							AS name,
				COALESCE(value_uuid, value_s)	AS value
			FROM
				constants
			WHERE
				name IN (${in})
EOT
		;

		$this->infobase_->dump_plan($sql);

		$result = $this->infobase_->query($sql);

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);
			$$name = $value;

		}

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

		$order_request['order'] = $order_products;

		$ch = curl_init();

		\runtime_exception::throw_false($ch);

		if( strtolower((substr($exchange_url, 0, 5)) === 'https') ) {
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
		}

		curl_setopt($ch, CURLOPT_HTTPHEADER			, [
			'Content-Type: application/json; charset=utf-8',
			'Cache-Control: no-store, no-cache, must-revalidate, max-age=0',
			'Accept: */*',
			//'Accept: application/json; charset=utf-8',
			//'Accept: text/html, application/xhtml+xml, application/xml; q=0.9,*/*; q=0.8',
			'Accept-Encoding: gzip, deflate'
		]);

		curl_setopt($ch, CURLOPT_USERPWD			, "$exchange_user:$exchange_pass");
		curl_setopt($ch, CURLOPT_HTTPAUTH			, CURLAUTH_BASIC);
		curl_setopt($ch, CURLOPT_FAILONERROR		, false);
		curl_setopt($ch, CURLOPT_URL				, $exchange_url);
		curl_setopt($ch, CURLOPT_REFERER			, $exchange_url);
		curl_setopt($ch, CURLOPT_VERBOSE			, false);
		curl_setopt($ch, CURLOPT_POST				, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION		, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS			, json_encode($order_request, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
		//curl_setopt($ch, CURLOPT_USERAGENT		, "Mozilla/4.0 (Windows; U; Windows NT 5.0; En; rv:1.8.0.2) Gecko/20070306 Firefox/1.0.0.4");
		curl_setopt($ch, CURLOPT_HEADER				, true);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER		, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT		, 15);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS	, 15000);
		curl_setopt($ch, CURLOPT_TIMEOUT			, 30);
		curl_setopt($ch, CURLOPT_TIMEOUT_MS			, 30000);
		//curl_setopt($ch, CURLOPT_COOKIEJAR		, TMP_DIR . 'cookie.txt');		// get auth
 		//curl_setopt($ch, CURLOPT_COOKIEFILE		, TMP_DIR . 'cookie.txt');		// use auth

		$response = curl_exec($ch);

		\curl_exception::throw_curl_error($ch);

		$curl_info = curl_getinfo($ch);
		curl_close($ch);			

		// if CURLOPT_FAILONERROR === true && http_code !== 200 then curl library automatical set curl_error to nonzero
		// and this check not needed

		if( $curl_info['http_code'] !== 200 ) {

			$msg = "\n" . $response;

			if( config::$debug )
				$msg .= "\n" . var_export($curl_info, true);

			throw new \runtime_exception($msg, $curl_info['http_code']);

		}

		$data = json_decode(substr($response, $curl_info['header_size']), true, 512, JSON_BIGINT_AS_STRING);
		\invalid_json_exception::throw_json_error();

		$data['name'] = $exchange_node_name;
		//$data['barcode_eangnivc'] = htmlspecialchars($data['barcode_eangnivc'], ENT_HTML5);

		$this->response_['order'] = $data;

	}

	protected function session_startup() {

		session_start([
			'cookie_lifetime' => 365 * 24 * 60 * 60
		]);

		if( @$_SESSION['DATA_ID'] === null )
			$_SESSION['DATA_ID'] = random_bytes(16);
	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->session_startup();

		$session_uuid = @$_SESSION['DATA_ID'];

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
				REPLACE INTO cart (
					session_uuid, product_uuid, quantity
				) VALUES (
					:session_uuid, :product_uuid, :quantity
				)
EOT
			;

			$st = $this->infobase_->prepare($sql);
			$st->bindParam(':session_uuid', $session_uuid, SQLITE3_BLOB);

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
			$st_barcode->bindParam(':session_uuid', $session_uuid, SQLITE3_BLOB);

			foreach( $products as $product ) {

				extract($product);

				$product_uuid = uuid2bin(@$uuid);
				$quantity = @$quantity;

				if( @$barcode !== null ) {
					$st_barcode->bindValue(':barcode', $barcode);
					$result = $st_barcode->execute();

					while( $r = $result->fetchArray(SQLITE3_ASSOC) )
						extract($r);
				}

				if( $product_uuid !== null ) {
					$st->bindValue(':product_uuid'	, $product_uuid, SQLITE3_BLOB);
					$st->bindValue(':quantity'		, floatval($quantity));
					$st->execute();
				}

			}

			$sql = <<<'EOT'
				REPLACE INTO cart
				SELECT
					c.session_uuid,
					c.product_uuid,
					q.quantity
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
			$st->bindValue(':session_uuid', $session_uuid, SQLITE3_BLOB);
			$st->execute();

			$sql = <<<'EOT'
				DELETE FROM cart WHERE session_uuid = :session_uuid AND quantity <= 0
EOT
			;

			$st = $this->infobase_->prepare($sql);
			$st->bindValue(':session_uuid', $session_uuid, SQLITE3_BLOB);
			$st->execute();

			if( config::$cart_timing ) {

				$ellapsed = $timer->last_nano_time();
		    	error_log('cart update, ellapsed: ' . $timer->ellapsed_string($ellapsed));

			}

		}

		$timer->restart();

		$this->response_['cart'] = $this->fetch_cart();

		if( config::$cart_timing ) {

			$ellapsed = $timer->last_nano_time();
	    	error_log('cart fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		$this->infobase_->commit_transaction();

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
