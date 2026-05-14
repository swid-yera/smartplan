import axios from 'axios'
import { apiBaseUrl, renderApiBaseUrl } from './public-env'

export const api = axios.create({
	baseURL: apiBaseUrl,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const renderApi = axios.create({
	baseURL: renderApiBaseUrl,
	withCredentials: true,
})
