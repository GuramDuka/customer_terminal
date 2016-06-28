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

		$pgsz = config::$page_size;

		extract(get_object_vars($this->request_));

		$this->infobase_->exec('BEGIN TRANSACTION');

		$category_table = 'products_' . uuid2table_name($category) . 'pages';

		$st = $this->infobase_->prepare(<<<EOT
			SELECT
				${order}_${direction}_uuid				AS uuid,
				${order}_${direction}_code				AS code,
				${order}_${direction}_name				AS name,
				${order}_${direction}_base_image_uuid	AS base_image_uuid,
				${order}_${direction}_base_image_ext	AS base_image_ext,
				${order}_${direction}_price				AS price,
				${order}_${direction}_quantity			AS quantity,
				${order}_${direction}_reserve			AS reserve
			FROM
				${category_table}
			WHERE
				pgnon BETWEEN :pgnon0 AND :pgnon1
			ORDER BY
				pgnon
EOT
		);

		$st->bindValue(':pgnon0', $pgno << 4);
		$st->bindValue(':pgnon1', ($pgno << 4) + ((1 << 4) - 1));
		$result = $st->execute();

		$page = [];

		for( $i = 0; $r = $result->fetchArray(SQLITE3_ASSOC); $i++ ) {

			extract($r);

			$uuid = bin2uuid($uuid);

			/*$fname = APP_DIR
				. get_product_path($u)
				. DIRECTORY_SEPARATOR . $uuid . '.html';

			$h = @fopen($fname, 'rb');

			\runtime_exception::throw_false($h);

			try {

				$s = fstat($h);

				$r = flock($h, LOCK_SH);
				\runtime_exception::throw_false($r);

				$html = fread($h, $s['size']);
				\runtime_exception::throw_false($html);

				flock($h, LOCK_UN);

			}
			finally {
				fclose($h);
			}*/

			if( $base_image !== null ) {
				$img_url = '/resources/'
					. get_image_path($base_image_uuid, '/')
					. '/' . bin2uuid($base_image_uuid)
					. '.' . (config::$convert_images ? config::$images_format : $base_image_ext);
			}
			else {
				$img_url = '/resources/asserts/nopic.jpg';
			}

			$img_url = htmlspecialchars($img_url, ENT_HTML5);
			$pname = htmlspecialchars($name, ENT_HTML5);
			$pprice = sprintf('%u', intval($price));
			$q = $quantity - $reserve;
			$q = sprintf(intval($q) == $q ? '%u' : '%.3f', $q);

			$w = config::$image_width;
			$h = config::$image_height;

			// style="visibility: hidden">
			$html = <<<EOT
<img pimg alt="" src="${img_url}" width="${w}" height="${h}">
<p pname>${pname}</p>
<p price>${pprice}&nbsp;₽</p>
<p quantity>${q}</p>
<a btn buy>КУПИТЬ</a>
EOT;

			$page[$i] = [
				'uuid'		=> $uuid,
				'code'		=> $code,
				'name'		=> $name,
				'price'		=> $price,
				'quantity'	=> $quantity,
				'reserve'	=> $reserve,
				'html'		=> $html,
				'img_url'	=> $img_url
			];

		}

		$this->response_['products'] = $page;

		$r = $this->infobase_->query("SELECT max(pgnon) FROM ${category_table}");
		list($pgnon) = $r->fetchArray(SQLITE3_NUM);
		$this->response_['pages'] = $r ? ($pgnon >> 4) + 1 : 0;

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_s = ellapsed_time_string($ellapsed_ms);

		$this->response_['ellapsed'] = $ellapsed_s;

	    //error_log('products page fetch, ellapsed: ' . $ellapsed_s);

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
