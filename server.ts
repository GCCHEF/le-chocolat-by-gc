import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const maintenanceAsset =
      pathname === '/le-chocolat-wordmark.png' ||
      pathname === '/images/le-chocolat-gc-monogram.png';

    if (env.SITE_MAINTENANCE === 'true' && !maintenanceAsset) {
      return maintenanceResponse(request);
    }

    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};

function maintenanceResponse(request: Request) {
  const headers = new Headers({
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '3600',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  });

  if (request.method === 'HEAD') {
    return new Response(null, {status: 503, headers});
  }

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <title>Le Chocolat by GC — Opening Soon</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        align-items: center;
        background: #f2f0e9;
        color: #171713;
        display: flex;
        font-family: Arial, Helvetica, sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100svh;
        padding: 32px;
      }
      main { max-width: 760px; text-align: center; width: 100%; }
      .monogram {
        display: block;
        height: auto;
        margin: 0 auto 42px;
        width: clamp(54px, 8vw, 78px);
      }
      .wordmark {
        display: block;
        height: auto;
        margin: 0 auto;
        max-width: 620px;
        width: min(86vw, 620px);
      }
      .message {
        font-size: clamp(14px, 2vw, 18px);
        letter-spacing: .02em;
        line-height: 1.6;
        margin: 46px auto 0;
        max-width: 520px;
      }
    </style>
  </head>
  <body>
    <main>
      <img class="monogram" src="/images/le-chocolat-gc-monogram.png" alt="">
      <img class="wordmark" src="/le-chocolat-wordmark.png" alt="Le Chocolat by GC">
      <p class="message">Our new online experience is being prepared with care. We look forward to welcoming you soon.</p>
    </main>
  </body>
</html>`,
    {status: 503, headers},
  );
}
