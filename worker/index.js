// Answers the requests that match no file in apps/playground/dist.
// Cloudflare serves files first. With not_found_handling set to single-page-application,
// a browser navigation to an unknown path gets index.html without reaching this script,
// so old links still open the playground. Every other request, such as curl or fetch
// for /.well-known/mcp.json, reaches this script and gets a real 404.
const BODY = `Not found.

topographic has no file at this path.
Docs for AI agents: https://topographic.yahyapak.dev/llms.txt
`;

export default {
  fetch() {
    return new Response(BODY, {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'x-content-type-options': 'nosniff',
      },
    });
  },
};
