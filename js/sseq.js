//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class sseq {

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

		this.oneshot_ = false;
		this.timeout_ = 3000;

		if( params ) {

			if( params.oneshot )
				this.oneshot_ = params.oneshot;

			if( params.away )
				this.away_ = params.away;

			if( params.back )
				this.back_ = params.back;

			if( params.timeout )
				this.timeout = params.timeout;

			this.start();

		}

	}

	start() {

		this.msg_source_ = new EventSource('/resources/core/mq/message.php');
		this.msg_source_.onmessage = function (e) {

	  		//let new_element = document.createElement('li');
			//new_element.innerHTML = 'message: ' + e.data;
			//eventList.appendChild(new_element);

			switch( mgs_source.readyState ) {
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

		};

		this.msg_source_.onerror = function (e) {
			console.log('EventSource failed.', e);
		};

	}

	stop() {

	}

}
//------------------------------------------------------------------------------
