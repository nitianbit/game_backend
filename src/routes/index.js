import adminRouter from "../modules/admin/routes.js";
import authRouter from "../modules/auth/routes.js"
import contestRouter from "../modules/contest/routes.js";
import payoutRouter from "../modules/payout/routes.js";
import { isValidAdmin } from "../modules/middlewares/index.js";


export const routes = {
    openRoutes: [
        // {
        //     path: '/api/contest',
        //     router: contestRouter
        // }
    ],
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
            path: '/api/users',
            router: adminRouter,
            middlewares: [isValidAdmin]
        },
        {
            path: '/api/sample-test-admin',
            router: authRouter,
            middlewares: [isValidAdmin]
        },
        {
            path: '/api/contest',
            router: contestRouter
        },
        {
            path: '/api/payout',
            router: payoutRouter
        }
    ],

}

// export const openRoutes = (server) => routes.openRoutes.map((r) => server.use(r.path, r.router))
export const authRoutes = (server) => routes.authRoutes.map((r) => server.use(r.path, r.router));
export const protectedRoutes = (server) => routes.protectedRoutes.map((r) => server.use(r.path, ...(r.middlewares ?? []), r.router));

