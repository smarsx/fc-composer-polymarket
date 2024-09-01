import { GetServerSideProps } from 'next'
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
    console.log('main handle submit')
    window.parent.postMessage({
      type: "createCast",
      data: {
        cast: {
          text: "xx",
          embeds: [generateEmbedUrl(pos.title ?? '', '100', pos.src ?? '', true)]
        }
      }
    })
  };

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          uwu&nbsp;
          <code className="font-mono font-bold">@smarsx</code>
        </p>
      </div>
      <div>
        <ConditionSelectionForm positions={accounts} onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
