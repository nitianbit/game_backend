import authRouter from "../modules/auth/routes.js"



export const routes = {
    // openRoutes: [
    //     {
    //         path: '/api/auth',
    //         router: mxRouter
    //     }
    // ],
    authRoutes: [
        {
            path: '/api/auth',
            router: authRouter
        }
    ],
    protectedRoutes: [
        {
            path: '/api/profile',
            router: authRouter
        }
    ],

}

// export const openRoutes = (server) => routes.openRoutes.map((r) => server.use(r.path, r.router))
export const authRoutes = (server) => routes.authRoutes.map((r) => server.use(r.path, r.router));
export const protectedRoutes = (server) => routes.protectedRoutes.map((r) => server.use(r.path, r.router));

