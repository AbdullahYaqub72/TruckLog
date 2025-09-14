import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TripDetails from './pages/TripDetails'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips/:id" element={<TripDetails />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
