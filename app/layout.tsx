import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Collab System - Team Collaboration Platform',
  description:
    'Production-grade SaaS platform for team collaboration with tasks, notes, and real-time chat.',
  keywords: ['collaboration', 'team', 'tasks', 'kanban', 'chat', 'notes'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
