import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";

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
        setLoading(true);
        setError("");

        try {
            const result = await login(form.username, form.password);
            if (result.user?.role === "Admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Invalid credentials. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans">
            {/* Ambient background glow accents */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <Card className="relative w-full max-w-md border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-xl">
                <CardHeader className="space-y-3 text-center pb-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-3xl shadow-lg shadow-amber-500/30">
                        🍺
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-white">
                            Beer Shop ERP
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-1">
                            Enter your credentials to access your store workspace
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {error && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    type="text"
                                    name="username"
                                    placeholder="e.g. admin or shop_owner"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    className="pl-9 bg-slate-950 border-slate-800 text-white focus-visible:ring-amber-500 placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="pl-9 bg-slate-950 border-slate-800 text-white focus-visible:ring-amber-500 placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="gradient"
                            className="w-full h-11 text-slate-950 font-bold mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />
                                    Authenticating...
                                </>
                            ) : (
                                "Sign In to ERP"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}