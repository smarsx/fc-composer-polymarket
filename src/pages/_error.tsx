import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextPageContext } from 'next';

interface ErrorPageProps {
  statusCode?: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode }) => {
  const router = useRouter();

  const errorMessages: { [key: number]: string } = {
    404: "Oops! This page doesn't exist.",
    500: "Sorry, something went wrong on our end.",
    555: "Oops! No addresses found for FID",
    556: "Oops! No positions found on Polymarket",
  };

  const message = statusCode ? errorMessages[statusCode] : "An unexpected error occurred.";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800">
      <h1 className="text-6xl font-bold mb-4">{statusCode}</h1>
      <p className="text-xl mb-8">{message}</p>
      <div className="space-x-4">
        <button
          onClick={() => router.back()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Go Back
        </button>
        <Link href="/" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-block transition duration-300">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export const getServerSideProps = async ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { props: { statusCode } };
};

export default ErrorPage;