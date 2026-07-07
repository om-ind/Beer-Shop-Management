export default function CustomerTable({

    customers,

    onEdit,

    onDelete,

}) {

    return (

        <div className="bg-white rounded-xl shadow overflow-hidden">

            <table className="w-full">

                <thead className="bg-gray-100">

                    <tr>

                        <th className="p-4 text-left">

                            Name

                        </th>

                        <th className="p-4 text-left">

                            Mobile

                        </th>

                        <th className="p-4 text-left">

                            Address

                        </th>

                        <th className="p-4 text-center">

                            Credit Balance

                        </th>

                        <th className="p-4 text-center">

                            Actions

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        customers.length === 0

                            ?

                            <tr>

                                <td

                                    colSpan="5"

                                    className="text-center py-10 text-gray-500"

                                >

                                    No Customers Found

                                </td>

                            </tr>

                            :

                            customers.map(customer => (

                                <tr

                                    key={customer.id}

                                    className="border-t"

                                >

                                    <td className="p-4">

                                        {customer.name}

                                    </td>

                                    <td className="p-4">

                                        {customer.mobile}

                                    </td>

                                    <td className="p-4">

                                        {customer.address}

                                    </td>

                                    <td className="p-4 text-center">

                                        ₹{Number(customer.credit_balance).toFixed(2)}

                                    </td>

                                    <td className="p-4">

                                        <div className="flex justify-center gap-2">

                                            <button

                                                onClick={() => onEdit(customer)}

                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded"

                                            >

                                                Edit

                                            </button>

                                            <button

                                                onClick={() => onDelete(customer.id)}

                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"

                                            >

                                                Delete

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                    }

                </tbody>

            </table>

        </div>

    );

}