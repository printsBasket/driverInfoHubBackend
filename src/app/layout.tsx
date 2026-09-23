export const metadata = {
  title: 'Driver Info Hub API',
  description: 'Backend API for Driver Info Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
