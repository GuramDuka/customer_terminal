//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class Idle {

	get events() {

		return [
			'click',
			'mousemove',
			'mouseenter',
			'keydown',
			'touchstart',
			'touchmove',
			'scroll',
			'mousewheel'
		];

	}

	get away() {
		return this.away_;
	}

	set away(v) {
		this.away_ = v;
	}

	get back() {
		return this.back_;
	}

	set back(v) {
		this.back_ = v;
	}

	get timeout() {
		return this.timeout_;
	}

	set timeout(v) {

		if( !Number.isInteger(v) )
			v = Number.parseInt(v);

		if( Number.isFinite(v) ) {

			if( !Number.isInteger(v) )
				v = Math.trunc(v);

			this.timeout_ = v;

		}

	}

	constructor(params) {

		this.activity_handler_call_	= () => this.activity_handler();
		this.timeout_handler_call_	= () => this.timeout_handler();

		this.oneshot_ = false;
		this.retry_ = false;
		this.timeout_ = 3000;

		if( params ) {

			if( params.oneshot !== undefined )
				this.oneshot_ = params.oneshot;

			if( params.retry !== undefined )
				this.retry_ = params.retry;

			if( params.away !== undefined )
				this.away_ = params.away;

			if( params.back !== undefined )
				this.back_ = params.back;

			if( params.timeout !== undefined )
				this.timeout = params.timeout;

			if( params.start !== undefined )
				this.start();

		}

	}

	setup_away_timer(timeout) {

		this.away_time_ = 0;

		if( this.away_timer_ )
			clearTimeout(this.away_timer_);

		this.away_timer_ = setTimeout(this.timeout_handler_call_, timeout);

	}

	activity_handler() {

		let t = mili_time();
		this.last_activity_time_ = t;

		if( this.away_time_ > 0 ) {

			// back after away
			if( this.back_ )
				this.back_();

			this.setup_away_timer(this.timeout_);

		}

	}

	timeout_handler() {

		let t = mili_time();
		let a = t - this.last_activity_time_;

		if( a >= this.timeout_ ) {

			// away timeout
			this.away_time_ = t;

			if( this.away_ )
				this.away_();

			if( this.oneshot_ ) {

				this.stop();

			}
			else if( this.retry_ ) {

				this.setup_away_timer(this.timeout_);

			}

		}
		else {

			// activity detected, restart timer on remainder of timeout
			this.setup_away_timer(this.timeout_ - a);

		}

	}

	start(timeout) {

		this.last_activity_time_ = 0;

		for( let event of this.events )
			window.addEventListener(event, this.activity_handler_call_, true);

		if( timeout )
			this.timeout = timeout;

		this.setup_away_timer(this.timeout_);

	}

	stop() {

		for( let event of this.events )
			window.removeEventListener(event, this.activity_handler_call_);

		clearTimeout(this.away_timer_);
		this.away_timer_ = undefined;

		this.away_time_ = 0;

	}

}
//------------------------------------------------------------------------------
