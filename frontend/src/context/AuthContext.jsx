import {

    createContext,

    useContext,

    useEffect,

    useState,

} from "react";

import {

    login as loginService,

    logout as logoutService,

    getCurrentUser,

} from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const currentUser = getCurrentUser();

        if (currentUser) {

            setUser(currentUser);

        }

        setLoading(false);

    }, []);

    async function login(username, password) {

        const data = await loginService(

            username,

            password

        );

        localStorage.setItem(

            "token",

            data.token

        );

        localStorage.setItem(

            "user",

            JSON.stringify(data.user)

        );

        setUser(data.user);

        return data;

    }

    function logout() {

        logoutService();

        setUser(null);

    }

    return (

        <AuthContext.Provider

            value={{

                user,

                login,

                logout,

                loading,

            }}

        >

            {children}

        </AuthContext.Provider>

    );

}

export function useAuth() {

    return useContext(AuthContext);

}