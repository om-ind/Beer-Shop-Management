import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";

import { getDashboard } from "../services/dashboardService";

import {
    FaMoneyBillWave,
    FaBox,
    FaUsers,
    FaTruck,
} from "react-icons/fa";

export default function Dashboard() {

    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {

        loadDashboard();

    }, []);

    async function loadDashboard() {

        try {

            const data = await getDashboard();

            setDashboard(data);

        } catch (err) {

            console.error(err);

        }

    }

    if (!dashboard) {

        return (

            <AdminLayout>

                <Navbar />

                <h2>Loading Dashboard...</h2>

            </AdminLayout>

        );

    }

    return (

        <AdminLayout>

            <Navbar />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <DashboardCard
                    title="Today's Sales"
                    value={`₹${dashboard.today_sales}`}
                    color="bg-green-600"
                    icon={<FaMoneyBillWave />}
                />

                <DashboardCard
                    title="Products"
                    value={dashboard.total_products}
                    color="bg-blue-600"
                    icon={<FaBox />}
                />

                <DashboardCard
                    title="Customers"
                    value={dashboard.total_customers}
                    color="bg-purple-600"
                    icon={<FaUsers />}
                />

                <DashboardCard
                    title="Suppliers"
                    value={dashboard.total_suppliers}
                    color="bg-orange-600"
                    icon={<FaTruck />}
                />

            </div>

        </AdminLayout>

    );

}