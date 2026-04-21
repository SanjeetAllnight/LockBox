import LoginPage from '../login/page'

// Since our existing Login page component handles both states beautifully
// with local state, we can just export it here for the /signup route to 
// resolve correctly without 404ing while maintaining the same code.
export default function SignupPage() {
  return <LoginPage />
}
