import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/app-layout';
import { Spinner } from './components/ui/feedback';
import { RequireAuth } from './features/auth/require-auth';
import { HomePage } from './features/posts/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { RouteErrorPage } from './pages/route-error-page';

/** Route-level code splitting: every page except the home feed is loaded on demand. */
const page = (load: () => Promise<{ Component: React.ComponentType }>) => ({
  lazy: load,
  hydrateFallbackElement: <Spinner />,
});

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <HomePage /> },
      {
        path: 'login',
        ...page(() =>
          import('./features/auth/login-page').then((m) => ({ Component: m.LoginPage })),
        ),
      },
      {
        path: 'register',
        ...page(() =>
          import('./features/auth/register-page').then((m) => ({ Component: m.RegisterPage })),
        ),
      },
      {
        path: 'g',
        ...page(() =>
          import('./features/subgeddits/subgeddits-page').then((m) => ({
            Component: m.SubgedditsPage,
          })),
        ),
      },
      {
        path: 'g/:name',
        ...page(() =>
          import('./features/subgeddits/subgeddit-page').then((m) => ({
            Component: m.SubgedditPage,
          })),
        ),
      },
      {
        path: 'posts/:id',
        ...page(() =>
          import('./features/posts/post-page').then((m) => ({ Component: m.PostPage })),
        ),
      },
      {
        path: 'u/:username',
        ...page(() =>
          import('./features/users/profile-page').then((m) => ({ Component: m.ProfilePage })),
        ),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'g/new',
            ...page(() =>
              import('./features/subgeddits/subgeddit-form-page').then((m) => ({
                Component: m.CreateSubgedditPage,
              })),
            ),
          },
          {
            path: 'g/:name/edit',
            ...page(() =>
              import('./features/subgeddits/subgeddit-form-page').then((m) => ({
                Component: m.EditSubgedditPage,
              })),
            ),
          },
          {
            path: 'submit',
            ...page(() =>
              import('./features/posts/create-post-page').then((m) => ({
                Component: m.CreatePostPage,
              })),
            ),
          },
          {
            path: 'settings/profile',
            ...page(() =>
              import('./features/users/edit-profile-page').then((m) => ({
                Component: m.EditProfilePage,
              })),
            ),
          },
          {
            path: 'friends',
            ...page(() =>
              import('./features/friends/friends-page').then((m) => ({ Component: m.FriendsPage })),
            ),
          },
          {
            path: 'chat',
            ...page(() =>
              import('./features/chat/chat-page').then((m) => ({ Component: m.ChatPage })),
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
