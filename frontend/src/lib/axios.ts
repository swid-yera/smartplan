import axios from 'axios'
import { getApiBaseUrl, getRenderApiBaseUrl } from './public-env'

export const api = axios.create({
	baseURL: getApiBaseUrl(),
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const renderApi = axios.create({
	baseURL: getRenderApiBaseUrl(),
	withCredentials: true,
})

api.interceptors.request.use(config => {
	config.baseURL = getApiBaseUrl()
	return config
})

renderApi.interceptors.request.use(config => {
	config.baseURL = getRenderApiBaseUrl()
	return config
})
