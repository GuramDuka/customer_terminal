<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class pending_orders {

	protected $parameters_;

	public function set_parameters($parameters) {
		return $this->parameters_ = $parameters;
	}

	protected $response_;

	public function get_response() {
		return $this->response_;
	}

	public function handler() {

		$timer = new \nano_timer;

		$infobase = new infobase;
		$infobase->initialize();

		if( @$this->parameters_['operation'] === 'GET' ) {
			$result = $infobase->query(<<<'EOT'
				SELECT
					request
				FROM
					pending_orders
				WHERE
					data = ''
EOT
			);

			$this->response_ = [];

			$ord_cnt = 0;

			while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {
				extract($r);

				$this->response_[] = json_decode($request, true, 512, JSON_BIGINT_AS_STRING);

				$ord_cnt++;
			}

			if( $ord_cnt !== 0 )
   				error_log("pending orders data get, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));
		}

		if( @$this->parameters_['operation'] === 'PUT' ) {
			$st = $infobase->prepare(<<<'EOT'
				UPDATE pending_orders SET
					data = :data
				WHERE
					order_uuid = :order_uuid
EOT
			);

			$ord_cnt = 0;
			foreach( $this->parameters_['orders'] as $order ) {

				$data_json = json_encode($order, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
				$st->bindValue(':order_uuid', uuid2bin($order['pending_uuid']), SQLITE3_BLOB);
				$st->bindValue(':data', $data_json);
				$st->execute();

				$ord_cnt++;
			}

			if( $ord_cnt !== 0 )
   				error_log("pending orders data put, ellapsed: " . $timer->ellapsed_string($timer->last_nano_time()));
		}
	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
