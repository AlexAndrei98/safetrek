const axios = require('axios')


module.exports = (address,payload,token) => {
	// config from https://docs.safetrek.io/reference?d_utk=57272ce9-2a8c-4a92-b580-08e96f4d2d5b#create-alarm
	const config = {
		headers:{ 
			'Content-Type': 'application/json', 
			'Authorization': `Bearer ${token}`
		}
	}
	const data = {
		'services': {
			'police': (payload === 'police') ? true : false,
			'fire': (payload === 'fire') ? true : false,
			'medical': (payload === 'medical') ? true : false
		},
		'location.coordinates': {
			'lat': address.lat,
			'long': address.long,
			'accuracy': 1
		}
	}
	return axios.post('https://api-sandbox.safetrek.io/v1/alarms',data, config)
		.then((response) => {
			return Promise.resolve(response)
		})
		.catch(error => {
			return Promise.reject(error)})
 
}