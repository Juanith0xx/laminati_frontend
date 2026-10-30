const DEFAULT_LOCAL_API_URL =
  "http://localhost:5001/api";

const ALLOWED_VARIANTS =
  new Set([
    "thumbnail",
    "card",
    "detail",
  ]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getApiBaseUrl = () => {
  const candidates = [
    process.env.API_SERVER_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ];

  for (const candidate of candidates) {
    const value = String(
      candidate || ""
    )
      .trim()
      .replace(/\/+$/, "");

    if (/^https?:\/\//i.test(value)) {
      return value;
    }
  }

  return DEFAULT_LOCAL_API_URL;
};

const proxyProductImage = async (
  method,
  params
) => {
  const resolvedParams =
    await params;

  const imageId =
    String(
      resolvedParams?.imageId || ""
    ).trim();

  const variant =
    String(
      resolvedParams?.variant || ""
    )
      .trim()
      .toLowerCase();

  if (
    !UUID_PATTERN.test(imageId) ||
    !ALLOWED_VARIANTS.has(variant)
  ) {
    return new Response(null, {
      status: 404,
    });
  }

  const upstreamUrl =
    `${getApiBaseUrl()}` +
    `/products/media/${encodeURIComponent(
      imageId
    )}/${encodeURIComponent(variant)}`;

  try {
    const upstream = await fetch(
      upstreamUrl,
      {
        method,
        cache: "no-store",
        redirect: "follow",
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        },
      }
    );

    if (!upstream.ok) {
      return new Response(null, {
        status:
          upstream.status === 404
            ? 404
            : 502,
      });
    }

    const headers = new Headers();

    const copyHeaders = [
      "content-type",
      "content-length",
      "etag",
      "last-modified",
    ];

    for (const name of copyHeaders) {
      const value =
        upstream.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    );

    headers.set(
      "Content-Disposition",
      "inline"
    );

    return new Response(
      method === "HEAD"
        ? null
        : upstream.body,
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "Error proxy imagen pública SEO:",
      error
    );

    return new Response(null, {
      status: 502,
    });
  }
};

export async function GET(
  _request,
  { params }
) {
  return proxyProductImage(
    "GET",
    params
  );
}

export async function HEAD(
  _request,
  { params }
) {
  return proxyProductImage(
    "HEAD",
    params
  );
}
