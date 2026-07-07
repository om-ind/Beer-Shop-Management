import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";

import ReportCard from "../components/Reports/ReportCard";
import SalesTrendChart from "../components/Reports/SalesTrendChart";
import TopProductsTable from "../components/Reports/TopProductsTable";
import LowStockTable from "../components/Reports/LowStockTable";

import {

    getDashboardReport,
    getSalesTrend,
    getTopProducts,
    getLowStockProducts,
    getProfitSummary,

} from "../services/reportService";

export default function Reports() {

    const [report, setReport] = useState({

        today_sales: 0,

        monthly_sales: 0,

        total_purchases: 0,

        low_stock: 0,

    });
    const [trend, setTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [profit, setProfit] = useState({

        total_profit: 0,

        total_items: 0,

    });

    useEffect(() => {

        loadReport();

    }, []);

    async function loadReport() {

        try {

            const dashboard = await getDashboardReport();

            const trendData = await getSalesTrend();

            const top = await getTopProducts();

            const low = await getLowStockProducts();
            const profitData = await getProfitSummary();

            setProfit(profitData);

            setReport(dashboard);

            setTrend(trendData);

            setTopProducts(top);

            setLowStock(low);

        }

        catch (err) {

            console.error(err);

        }

    }

    return (

        <AdminLayout>

            <Navbar />

            <h1 className="text-3xl font-bold mb-8">

                Reports Dashboard

            </h1>

            <div className="grid grid-cols-4 gap-6">

                <ReportCard

                    title="Today's Sales"

                    value={`₹${report.today_sales}`}

                    color="bg-blue-600"

                />

                <ReportCard

                    title="Monthly Sales"

                    value={`₹${report.monthly_sales}`}

                    color="bg-green-600"

                />

                <ReportCard

                    title="Purchases"

                    value={`₹${report.total_purchases}`}

                    color="bg-orange-600"

                />

                <ReportCard

                    title="Low Stock"

                    value={report.low_stock}

                    color="bg-red-600"

                />

            </div>
            <SalesTrendChart data={trend} />
            <TopProductsTable products={topProducts} />
            <LowStockTable products={lowStock} />
            <div className="grid grid-cols-2 gap-6 mt-6">

                <ReportCard

                    title="Total Profit"

                    value={`₹${profit.total_profit}`}

                    color="bg-purple-600"

                />

                <ReportCard

                    title="Items Sold"

                    value={profit.total_items}

                    color="bg-indigo-600"

                />

            </div>

        </AdminLayout>

    );

}