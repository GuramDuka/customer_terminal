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
class orderer_handler extends handler {

	protected $infobase_;
	protected $session_uuid_;

	protected function fetch_constants() {

		$constants = [
			'exchange_node'					=> null,
			'exchange_url'					=> null,
			'exchange_user'					=> null,
			'exchange_pass'					=> null,
			'pending_orders'				=> null
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

			if( $value_type === 4 )
				$a[$name] = bin2uuid($value);
			else
				$a[$name] = $value;

		}

		return $a;

	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->session_uuid_ = session_startup();
		$this->infobase_ = new infobase;
		$this->infobase_->initialize();

		$this->infobase_->begin_transaction();
		extract($this->fetch_constants());
		$this->infobase_->commit_transaction();

		extract($this->request_);

		$request = [
			'exchange_node' => $exchange_node,
			'order'			=> $order
		];

		if( @$customer !== null )
			$request['customer'] = $customer;
		if( @$comment !== null )
			$request['comment'] = $comment;
		if( @$remove !== null )
			$request['remove'] = $remove;

		$data = null;

		if( @$pending_orders ) {
			$request_json = json_encode($request, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

			$sql = <<<'EOT'
				REPLACE INTO pending_orders (
					session_uuid, order_uuid, request, data
				) VALUES (
					:session_uuid, :order_uuid, :request, ''
				)
EOT
			;

			$st = $this->infobase_->prepare($sql);
			$st->bindValue(':session_uuid', $this->session_uuid_, SQLITE3_BLOB);
			$st->bindValue(':order_uuid', uuid2bin($order), SQLITE3_BLOB);
			$st->bindValue(':request', $request_json);
			$st->execute();
		}
		else if( @$customer !== null || @$comment !== null || @$remove !== null ) {
			$data = request_exchange_node($exchange_url . '/order', $exchange_user, $exchange_pass, $request);
			$this->response_['order'] = $data;
		}

		if( @$pending_orders ) {
			//$this->infobase_->begin_transaction();
			//$this->infobase_->commit_transaction();
		}
		else if( $data !== null ) {
			$orders = @$_SESSION['ORDERS'];

			if( $orders === null )
				$orders = [];
			else
				$orders = unserialize(bzdecompress(base64_decode($orders)));

			if( @$customer !== null ) {
				$orders[$order]['customer_uuid'] = $data['customer_uuid'];
				$orders[$order]['customer'] = htmlspecialchars($data['customer'], ENT_HTML5);
			}
			else if( @$comment !== null ) {
				$orders[$order]['comment'] = htmlspecialchars($data['comment'], ENT_HTML5);
			}
			else if( @$this->request_['remove'] !== null ) {
				unset($orders[$order]);
			}

			if( count($orders) !== 0 ) {
				$_SESSION['ORDERS'] = base64_encode(bzcompress(serialize($orders), 9));
			}
			else if( @$_SESSION['ORDERS'] !== null ) {
				unset($_SESSION['ORDERS']);
			}
		}

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('customer order changed, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
