export default function ReportCard({

    title,

    value,

    color,

}) {

    return (

        <div className={`rounded-xl shadow-lg p-6 text-white ${color}`}>

            <h3 className="text-lg">

                {title}

            </h3>

            <h1 className="text-3xl font-bold mt-3">

                {value}

            </h1>

        </div>

    );

}