//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class ServerSentEvents {

/*
	// https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
	// http://www.html5rocks.com/en/tutorials/eventsource/basics/
	// http://stackoverflow.com/questions/9070995/html5-server-sent-events-prototyping-ambiguous-error-and-repeated-polling
	// http://stackoverflow.com/questions/14202191/broadcasting-messages-with-server-sent-events
	// SSE Server-Side Events

	msg_source.addEventListener('ping', function (e) {
		//let newElement = document.createElement("li");
  		let obj = JSON.parse(e.data, JSON.dateParser);
  		//newElement.innerHTML = "ping at " + obj.time;
		//eventList.appendChild(newElement);
		Render.debug(8, 'ping at ' + obj.time);
	}, false);

*/

	constructor(params) {

		this.start_ = function () {

			try {

				this.msg_source_ = new EventSource(this.url_);
				this.msg_source_.onmessage	= e => this.message(e);
				this.msg_source_.onerror	= e => this.error(e);

			}
			catch( e ) {

				console.log(e);
				this.sseq_timer_ = setTimeout(this.start_, 100);

			}

		};

		if( params ) {

			if( params.url )
				this.url_ = params.url;

			if( params.start )
				this.start_ = params.start;

			if( this.start_ )
				this.start();

		}

	}

	message(e) {

  		//let new_element = document.createElement('li');
		//new_element.innerHTML = 'message: ' + e.data;
		//eventList.appendChild(new_element);
		console.log('message: ' + e.data + ', last-event-id: ' + e.lastEventId);

		switch( this.msg_source_.readyState ) {
			case EventSource.CONNECTING	:
				// do something
				break;
			case EventSource.OPEN		:
				// do something
				break;
			case EventSource.CLOSED		:
				// do something
				break;
			default						:
				// this never happens
				break;
		}

	}

	error(e) {
		//console.log('EventSource failed.', e);
	};

	start() {

		this.start_();

	}

	stop() {

		if( this.msg_source_ ) {

			this.msg_source_.close();
			this.msg_source_ = undefined;

		}

	}

}
//------------------------------------------------------------------------------
