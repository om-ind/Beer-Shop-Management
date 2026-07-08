import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [form, setForm] = useState({

        username: "",

        password: "",

    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    function handleChange(e) {

        setForm({

            ...form,

            [e.target.name]: e.target.value,

        });

    }

    async function handleSubmit(e) {

        e.preventDefault();

        console.log("1. Login button clicked");

        setLoading(true);

        setError("");

        try {

            console.log("2. Calling AuthContext login()");

            const result = await login(

                form.username,

                form.password

            );

            console.log("3. Login successful", result);

            navigate("/dashboard");

        }

        catch (err) {

            console.error("Login Error:", err);

            setError(

                err.response?.data?.message ||

                err.message ||

                "Login failed"

            );

        }

        setLoading(false);

    }
    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">

                <h1 className="text-3xl font-bold text-center">

                    🍺 Beer Shop ERP

                </h1>

                <p className="text-center text-gray-500 mt-2">

                    Login to continue

                </p>

                {error && (

                    <div className="bg-red-100 text-red-700 p-3 rounded mt-4">

                        {error}

                    </div>

                )}

                <form

                    onSubmit={handleSubmit}

                    className="mt-6 space-y-4"

                >

                    <input

                        type="text"

                        name="username"

                        placeholder="Username"

                        value={form.username}

                        onChange={handleChange}

                        className="w-full border rounded-lg p-3"

                    />

                    <input

                        type="password"

                        name="password"

                        placeholder="Password"

                        value={form.password}

                        onChange={handleChange}

                        className="w-full border rounded-lg p-3"

                    />

                    <button

                        type="submit"

                        disabled={loading}

                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3"

                    >

                        {loading ? "Logging in..." : "Login"}

                    </button>

                </form>

            </div>

        </div>

    );

}