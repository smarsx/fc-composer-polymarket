import { GetServerSideProps } from 'next'
import Image from "next/image";
import { useState } from "react";
import { getPositionsByProxy } from "@/lib/sql";
import ConditionSelectionForm from "@/components/conditions";
import { DEPLOYMENT_URL } from "@/lib/constants";
import { Position } from '@/lib/position';
import { getProxiesFromUrl } from '@/lib/proxy';

function generateEmbedUrl(
  title: string,
  pct: string,
  src: string,
  isYes: boolean
): string {
  return `${DEPLOYMENT_URL}/api/generate?src=${src}?title=${title}?pct=${pct}?isYes=${
    isYes ? "1" : "0"
  }`;
}

interface Props {
  positions: Position[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const proxies = getProxiesFromUrl(context.req.url || '');
  const fetchedPositions = await getPositionsByProxy(proxies);

  return {
    props: {
      positions: fetchedPositions
    },
  };
};

export default function Home({ positions }: Props) {
  const [accounts] = useState<Position[]>(positions);

  const handleSubmit = (pos: Position) => {
    // grab selectedCondition src url
    window.parent.postMessage({
      type: "createCast",
      data: {
        cast: {
          text: "",
          embeds: [generateEmbedUrl('', '', '', true)]
        }
      }
    })
  };

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          uwu&nbsp;
          <code className="font-mono font-bold">@samuellhuber</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://dtech.vision"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
            <Image
              src="/dtech.png"
              alt="dTech Logo"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>
      <div>
        <ConditionSelectionForm positions={positions} onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
