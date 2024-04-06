import authRouter from "../modules/auth/routes.js"
import { isValidAdmin } from "../modules/middlewares/index.js";



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
            router: authRouter,
        }
    ],
    protectedRoutes: [
        {
            path: '/api/profile',
            router: authRouter
        },
        {
            path: '/api/sample-test-admin',
            router: authRouter,
            middlewares: [isValidAdmin]
        }
    ],

}

// export const openRoutes = (server) => routes.openRoutes.map((r) => server.use(r.path, r.router))
export const authRoutes = (server) => routes.authRoutes.map((r) => server.use(r.path, r.router));
export const protectedRoutes = (server) => routes.protectedRoutes.map((r) => server.use(r.path, ...(r.middlewares ?? []), r.router));

