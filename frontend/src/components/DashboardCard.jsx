export default function DashboardCard({
    title,
    value,
    color = "bg-blue-600",
    icon,
}) {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <h2 className="text-3xl font-bold mt-2">{value}</h2>
                </div>

                <div className={`${color} text-white p-4 rounded-full text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}