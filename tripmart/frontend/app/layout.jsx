import './globals.css'

export const metadata = {
  title: 'TripSmart - Travel Planning Made Easy',
  description: 'Plan your perfect trip with intelligent price alerts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  )
}