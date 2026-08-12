import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { router } from './router'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
