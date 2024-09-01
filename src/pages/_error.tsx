import React from 'react';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next';

interface ErrorPageProps {
  statusCode?: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode: propStatusCode }) => {
  const router = useRouter();
  const { code } = router.query;

  // Use the code from the query parameter if available, otherwise use the prop
  const statusCode = code ? Number(code) : propStatusCode;

  const errorMessages: { [key: number]: string } = {
    404: "Oops! This page doesn't exist.",
    500: "Sorry, something went wrong on our end.",
    555: "Oops! No addresses found for FID",
    556: "Oops! No positions found on Polymarket",
  };

  const message = statusCode ? errorMessages[statusCode] || "An unexpected error occurred." : "An unexpected error occurred.";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800">
      <h1 className="text-6xl font-bold mb-4">{statusCode}</h1>
      <p className="text-xl mb-8">Error: {message}</p>
    </div>
  );
};

export const getServerSideProps = async ({ res, err, query }: NextPageContext) => {
  const statusCode = query.code ? Number(query.code) : res ? res.statusCode : err ? err.statusCode : 404;
  return { props: { statusCode } };
};

export default ErrorPage;