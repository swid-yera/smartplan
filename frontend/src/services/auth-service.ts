export class AuthService {
	// redirect to login
	redirectToLogin() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/login`
		}
	}

	// redirect to logout
	redirectToLogout() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/logout`
		}
	}
}
