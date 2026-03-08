import type { Metadata } from 'next';
import { Providers } from './providers';
import type { ProvidersChildren } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentic // Workflow',
  description: 'Agentic engineering workflow frontend',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ProvidersChildren;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
