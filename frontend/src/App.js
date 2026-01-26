import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import OrderList from './pages/orders/OrderList';
import OrderDetails from './pages/orders/OrderDetails';
import CreateOrder from './pages/orders/CreateOrder';
import InventoryList from './pages/inventory/InventoryList';
import ProductList from './pages/products/ProductList';
import AddProduct from './pages/products/AddProduct';
import CustomerList from './pages/customers/CustomerList';
import AddCustomer from './pages/customers/AddCustomer';
import ShipmentList from './pages/shipments/ShipmentList';
import ShipmentDetails from './pages/shipments/ShipmentDetails';
import CreateShipment from './pages/shipments/CreateShipment';
import SupplierList from './pages/suppliers/SupplierList';
import AddSupplier from './pages/suppliers/AddSupplier';
import ReceiveStock from './pages/inventory/ReceiveStock';
import EditInventory from './pages/inventory/EditInventory';
import EditSupplier from './pages/suppliers/EditSupplier';
import VehicleList from './pages/vehicles/VehicleList';
import AddVehicle from './pages/vehicles/AddVehicle';
import DriverList from './pages/drivers/DriverList';
import AddDriver from './pages/drivers/AddDriver';
import EditDriver from './pages/drivers/EditDriver';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrderList />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PrivateRoute>
                <OrderDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <PrivateRoute>
                <CreateOrder />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <InventoryList />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory/receive"
            element={
              <PrivateRoute>
                <ReceiveStock />
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PrivateRoute>
                <SupplierList />
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers/new"
            element={
              <PrivateRoute>
                <AddSupplier />
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers/edit/:id"
            element={
              <PrivateRoute>
                <EditSupplier />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory/edit/:id"
            element={
              <PrivateRoute>
                <EditInventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <ProductList />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <PrivateRoute>
                <AddProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <CustomerList />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <PrivateRoute>
                <AddCustomer />
              </PrivateRoute>
            }
          />

          <Route
            path="/shipments"
            element={
              <PrivateRoute>
                <ShipmentList />
              </PrivateRoute>
            }
          />
          <Route
            path="/shipments/:id"
            element={
              <PrivateRoute>
                <ShipmentDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/shipments/new"
            element={
              <PrivateRoute>
                <CreateShipment />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <PrivateRoute>
                <VehicleList />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles/new"
            element={
              <PrivateRoute>
                <AddVehicle />
              </PrivateRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <PrivateRoute>
                <DriverList />
              </PrivateRoute>
            }
          />
          <Route
            path="/drivers/new"
            element={
              <PrivateRoute>
                <AddDriver />
              </PrivateRoute>
            }
          />
          <Route
            path="/drivers/:id/edit"
            element={
              <PrivateRoute>
                <EditDriver />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <AnalyticsDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;