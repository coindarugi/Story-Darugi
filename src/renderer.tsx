import { jsxRenderer } from 'hono/jsx-renderer'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string, description?: string, image?: string, url?: string }): Response
  }
}

export const renderer = jsxRenderer(({ children, title, description, image, url }) => {
  const siteName = '스토리 다루기'
  const siteDescription = description || '일상의 모든 순간을 기록하고 공유하는 공간, 스토리 다루기입니다.'
  const siteImage = image || 'https://images.unsplash.com/photo-1499750310159-5b5f2269a2d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80' // Default OG Image
  const siteUrl = url ? `https://story-darugi.com${url}` : 'https://story-darugi.com'

  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO Meta Tags */}
        <title>{title ? `${title} - ${siteName}` : siteName}</title>
        <meta name="description" content={siteDescription} />
        <link rel="canonical" href={siteUrl} />
        
        {/* Open Graph / Facebook / Kakao */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={title ? `${title} - ${siteName}` : siteName} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:image" content={siteImage} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta property="twitter:title" content={title ? `${title} - ${siteName}` : siteName} />
        <meta property="twitter:description" content={siteDescription} />
        <meta property="twitter:image" content={siteImage} />

        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  brand: {
                    yellow: '#FFF787',
                    purple: '#787FFF',
                    'purple-dark': '#5a5fcf',
                  }
                },
                fontFamily: {
                  sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'sans-serif'],
                  title: ['Montserrat', 'sans-serif'], 
                }
              }
            }
          }
        `}} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Custom Markdown Styles */
          .markdown-body { color: #4b5563; }
          .markdown-body h1 { font-size: 2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.8em; color: #787FFF; }
          .markdown-body h2 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.8em; color: #4b5563; }
          .markdown-body p { margin-bottom: 1.2em; line-height: 1.8; }
          .markdown-body a { color: #787FFF; text-decoration: underline; text-underline-offset: 4px; }
          .markdown-body a:hover { background-color: #FFF787; color: #5a5fcf; }
          .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1.2em; }
          .markdown-body pre { background: #ffffff; padding: 1.2em; border-radius: 0.8em; overflow-x: auto; margin-bottom: 1.5em; border: 1px solid #e5e7eb; }
          .markdown-body code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.25em; font-family: monospace; color: #787FFF; }
          .markdown-body blockquote { border-left: 3px solid #FFF787; padding-left: 1em; color: #9ca3af; font-style: italic; }
          .markdown-body img { max-width: 100%; height: auto; border-radius: 0.5em; margin: 2em 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        `}} />
      </head>
      <body class="font-sans min-h-screen text-gray-800 antialiased selection:bg-brand-yellow selection:text-brand-purple">
        {/* Full Screen Gradient Background */}
        <div class="fixed inset-0 -z-10 bg-gradient-to-br from-[#FFF787] via-[#F8F8FF] to-[#787FFF]"></div>
        
        {/* Minimal Header (Empty for layout spacing) */}
        <header class="fixed top-0 left-0 w-full z-50 p-6 md:p-8 flex justify-between items-center pointer-events-none">
          {/* Header content removed as requested */}
        </header>

        <main class="relative w-full">
          {children}
        </main>
        
        <footer class="relative z-10 py-10 text-center text-white/40 text-xs tracking-widest font-light">
           &copy; {new Date().getFullYear()} STORY DARUGI
        </footer>
      </body>
    </html>
  )
})
