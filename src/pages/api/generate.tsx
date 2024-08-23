import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
 
export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const src = searchParams.get('src');

  if (!src) {
    return new ImageResponse(<>invalid img</>, {
      width: 1200,
      height: 630,
    });
  }
 
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 60,
          color: 'black',
          background: '#f6f6f6',
          width: '100%',
          height: '100%',
          paddingTop: 50,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          width="256"
          height="256"
          src={src}
          style={{
            borderRadius: 128,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}