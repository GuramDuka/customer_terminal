<?php
//------------------------------------------------------------------------------
namespace {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
// before use don'n forget execute cmd "bcdedit /set useplatformclock true"
class nano_timer {

	protected $counter_;
	protected $freq_;
	protected $nano_mult_;

	public function __construct($start = true) {

		//parent::__construct();

		$this->counter_ = new HRTime\PerformanceCounter;
		$this->freq_ = $this->counter_->getFrequency();
		$this->nano_mult_ = 1000000000;

		if( $start )
			$this->counter_->start();

	}

	public function nano_mult() {

		return $this->nano_mult_;

	}

	public function nano2secs($ns) {

		return bcdiv($ns, $this->nano_mult_, 9);

	}

	public function restart() {

		if( $this->counter_->isRunning() )
			$this->counter_->stop();

		$this->counter_->start();

	}

	public function last_nano_time($restart = true) {

		if( $restart )
			$this->counter_->stop();

		$t = bcdiv(bcmul($this->counter_->getLastElapsedTicks(), $this->nano_mult_), $this->freq_);

		if( $restart )
			$this->counter_->start();

		return $t;

	}

	public function nano_time($seconds = true, $stop = true) {

		if( $stop )
			$this->counter_->stop();

		$ns = bcdiv(bcmul($this->counter_->getElapsedTicks(), $this->nano_mult_), $this->freq_);

		if( $seconds )
			return [ $ns, $this->nano2secs($ns) ];

		return $ns;

	}

	public function ellapsed_string($ns) {

		$nsecs	= bcmod($ns, $this->nano_mult_);
		$a		= bcdiv($ns, $this->nano_mult_, 0);
		$days	= bcdiv($a, 60 * 60 * 24, 0);
		$hours	= bcdiv($a, 60 * 60, 0) - bcmul($days, 24, 0);
		$mins	= bcdiv($a, 60, 0) - bcmul($days, 24 * 60) - bcmul($hours, 60);
		$secs	= bcsub(bcsub(bcsub($a, bcmul($days, 24 * 60 * 60, 0), 0), bcmul($hours, 60 * 60, 0), 0), bcmul($mins, 60, 0), 0);

		if( bccomp($days, 0, 0) !== 0 )
			$s = sprintf('%u:%02u:%02u:%02u.%09u', $days, $hours, $mins, $secs, $nsecs);
		else if( bccomp($hours, 0, 0) !== 0 )
			$s = sprintf('%2u:%02u:%02u.%09u', $hours, $mins, $secs, $nsecs);
		else if( bccomp($mins, 0, 0) !== 0 )
			$s = sprintf('%2u:%02u.%09u', $mins, $secs, $nsecs);
		else if( bccomp($secs, 0, 0) !== 0 )
			$s = sprintf('%2u.%09u', $secs, $nsecs);
		else
			$s = sprintf('.%09u', $nsecs);

		return $s;

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
function usleep_win($ms) {

	$sec	= bcdiv($ms, 1000000, 0);
	$usec	= bcmod($ms, 1000000);
	$read	= NULL;
	$write	= NULL;
	$sock	= [ socket_create(AF_INET, SOCK_RAW, 0) ];

	socket_select($read, $write, $sock, $sec, $usec);

}
//------------------------------------------------------------------------------
function micro_time() {

	/*list($u, $s) = explode(' ', microtime(false));

    return bcadd(bcmul($s, 1000000, 0), bcmul($u, 1000000, 0), 0);*/

	$t = gettimeofday();

	return bcadd(bcmul($t['sec'], 1000000), $t['usec']);

}
//------------------------------------------------------------------------------
function ellapsed_time_string($ms) {

	$a		= bcdiv($ms, 1000000, 0);
	$days	= bcdiv($a, 60 * 60 * 24, 0);
	$hours	= bcdiv($a, 60 * 60) - bcmul($days, 24, 0);
	$mins	= bcdiv($a, 60, 0) - bcmul($days, 24 * 60) - bcmul($hours, 60);
	$secs	= bcsub(bcsub(bcsub($a, bcmul($days, 24 * 60 * 60, 0), 0), bcmul($hours, 60 * 60, 0), 0), bcmul($mins, 60, 0), 0);
	$msecs	= bcmod($ms, 1000000);

	$s = sprintf('%02u:%02u:%02u.%06u', $hours, $mins, $secs, $msecs);

	if( $days !== 0 )
		$s = sprintf('%u', $days) . ':' . $s;

	return $s;

}
//------------------------------------------------------------------------------
function uuid2bin($u, $delimiter = '-') {

	if( $u === null )
		return $u;

	return hex2bin(str_replace($delimiter, '', $u));
}
//------------------------------------------------------------------------------
function bin2uuid($b, $delimiter = '-') {

	if( $b === null )
		return $b;

	$u = bin2hex($b);
	// sample: 2586af57-9d34-11e4-a702-001e673659ad
	return             substr($u,  0,  8)
		. $delimiter . substr($u,  8,  4)
		. $delimiter . substr($u, 12,  4)
		. $delimiter . substr($u, 16,  4)
		. $delimiter . substr($u, 20, 12)
	;

}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
