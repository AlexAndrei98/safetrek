'use strict'
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN
// Imports dependencies and set up http server
const 
	request = require('request'),
	express = require('express'),
	body_parser = require('body-parser'),
	app = express().use(body_parser.json()) // creates express http server
const sendAlarm = require('./mymodules/sendAlarm')

let aToken =''
let loggedIn = false
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'))

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

	// Parse the request body from the POST
	let body = req.body

	// Check the webhook event is from a Page subscription
	if (body.object === 'page') {

		body.entry.forEach(function(entry) {

			// Gets the body of the webhook event
			let webhook_event = entry.messaging[0]
			//console.log(webhook_event);
			if(webhook_event.message)
				console.log('-----------------message is ',webhook_event.message.text)
			// Get the sender PSID
			let sender_psid = webhook_event.sender.id
      
      
			//if message is undefined then make it empty so no console errors.
			if(typeof(webhook_event.message) == 'undefined'){
				webhook_event.message= ''
			}
			if (webhook_event.message && aToken.length<2){
				sendLogin(sender_psid)
				console.log('loggedin sendLogin')
				//loggedIn = true
			}

			//if the message is the location then send the quick replies
			if(webhook_event.message.attachments && loggedIn){
				console.log('lat is  ',webhook_event.message.attachments[0].payload.coordinates.lat)
				console.log('long is ',webhook_event.message.attachments[0].payload.coordinates.long)
				sendQuickReplies(sender_psid)

			}
			//if message is not a quick reply or the location
			else if (webhook_event.message && loggedIn) {
				handleMessage(sender_psid, webhook_event.message)        
			}
			else{
				console.log('not loggedin')
			}
      
		})
		// Return a '200 OK' response to all events
		res.status(200).send('EVENT_RECEIVED')

	} else {
		// Return a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404)
	}

})

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
	/** UPDATE YOUR VERIFY TOKEN **/
	const VERIFY_TOKEN = 'safetrek-chatbot'
  
	// Parse params from the webhook verification request
	let mode = req.query['hub.mode']
	let token = req.query['hub.verify_token']
	let challenge = req.query['hub.challenge']
    
	// Check if a token and mode were sent
	if (mode && token) {
  
		// Check the mode and token sent are correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
			// Respond with 200 OK and challenge token from the request
			console.log('WEBHOOK_VERIFIED')
			res.status(200).send(challenge)
    
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403)      
		}
	}
})

function handleMessage(sender_psid, received_message) {
	let response
  
	if (received_message.text.match('help') ) {    
		sendLocation(sender_psid)
	} 
	else {
		response = {
			'text': 'You do not need help'
		}
	} 
	if(received_message.quick_reply){
		if(received_message.quick_reply.payload.match('police')){
			response = {
				'text':'We will call 911'
			}
		}
		else if(received_message.quick_reply.payload.match('medical')){
			response = {
				'text':'We will call the ambulance'
			}
		}
		else if(received_message.quick_reply.payload.match('fire')){
			response = {
				'text':'We will call the fire'
			}
		}
	}
  
	// Send the response message
	callSendAPI(sender_psid, response)    
}



function callSendAPI(sender_psid, response) {
	// Construct the message body
	let request_body = {
		'recipient': {
			'id': sender_psid
		},
		'message': response
	}

	// Send the HTTP request to the Messenger Platform
	request({
		'uri': 'https://graph.facebook.com/v2.6/me/messages',
		'qs': { 'access_token': PAGE_ACCESS_TOKEN },
		'method': 'POST',
		'json': request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!')
		} else {
			console.error('Unable to send message:' + err)
		}
	}) 
}

function sendQuickReplies(sender_psid){
	// Construct the message body
	let request_body = {
		'recipient': {
			'id': sender_psid
		},
		'message': {
			'text': 'What kind of help do you need?',
			'quick_replies':[
				{
					'content_type':'text',
					'title':'Police',
					'payload':'police',
				},
				{
					'content_type':'text',
					'title':'Ambulance',
					'payload':'medical',
				},          {
					'content_type':'text',
					'title':'Fire Department',
					'payload':'fire',
				}
			]
		}
	}
	// Send the HTTP request to the Messenger Platform
	request({
		'uri': 'https://graph.facebook.com/v2.6/me/messages',
		'qs': { 'access_token': PAGE_ACCESS_TOKEN },
		'method': 'POST',
		'json': request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('login message sent!')
		} else {
			console.error('Unable to send message:' + err)
		}
	}) 
}

function sendLocation(sender_psid){
	// Construct the message body
	let request_body = {
		'recipient': {
			'id': sender_psid
		},
		'message': {
			'text': 'Send us your location',
			'quick_replies':[
				{
					'content_type':'location',
					'title':'location',
					'payload':'location',
				}
			]
		}
	}
	// Send the HTTP request to the Messenger Platform
	request({
		'uri': 'https://graph.facebook.com/v2.6/me/messages',
		'qs': { 'access_token': PAGE_ACCESS_TOKEN },
		'method': 'POST',
		'json': request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!')
		} else {
			console.error('Unable to send message:' + err)
		}
	}) 
}

function sendLogin(sender_psid){
	let request_body = {
		'recipient': {
			'id': sender_psid
		},
		'message': {
			'attachment': {
				'type':'template',
				'payload':{
					'template_type':'button',
					'text':'Try the log in button!',
					'buttons':[
						{
							//not working
							'type': 'account_link',
							'url': 'https://account-sandbox.safetrek.io/authorize?audience=https://api-sandbox.safetrek.io&client_id=gk1nFtbQr4pBpJD0rzAp3vaSi555sm4s&scope=openid+phone+offline_access&response_type=code&redirect_uri=https://safetrek-chatbot.herokuapp.com/callback',
						}
					]
				}
			}
			
		}
	}
  
	// Send the HTTP request to the Messenger Platform
	request({
		'uri': 'https://graph.facebook.com/v2.6/me/messages',
		'qs': { 'access_token': PAGE_ACCESS_TOKEN },
		'method': 'POST',
		'json': request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('login message sent!')
		} else {
			console.error('Unable to send message:' + err)
		}
	}) 

}