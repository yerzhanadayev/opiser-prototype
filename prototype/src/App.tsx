import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import Kadry from './pages/Kadry'
import RiskMap from './pages/RiskMap'
import OrdersGG from './pages/OrdersGG'
import SER from './pages/SER'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/opiser/kadry" replace />} />
        <Route path="opiser/kadry" element={<Kadry />} />
        <Route path="opiser/risk-map" element={<RiskMap />} />
        <Route path="opiser/orders-gg" element={<OrdersGG />} />
        <Route path="opiser/ser" element={<SER />} />
      </Route>
    </Routes>
  )
}
