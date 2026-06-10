import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/quotes')({
  component: () => <Outlet />,
})
