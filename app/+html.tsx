import React, { ReactNode } from "react";

export default function Html({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-t-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover"
        />
        
        {/* 
          Expo Router sẽ tự động chèn các thẻ PWA cần thiết (manifest, theme-color, apple-touch-icon, etc.)
          dựa trên cấu hình trong app.json. Không cần thêm thủ công ở đây.
        */}
        
        {/* 
          The `Style` and `Scripts` components are automatically injected by Expo Router.
          Do not add them manually.
        */}
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(error => {
                      console.error('Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}