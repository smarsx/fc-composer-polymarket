import Image from "next/image";
import { useEffect, useState } from "react";
import { Account, Condition, MarketProfit } from "@/lib/types";
import { getAccountsByProxy } from "@/lib/sql";
import ConditionSelectionForm from "@/components/conditions";
import { DEPLOYMENT_URL } from "@/lib/constants";

function getProxiesFromUrl(url: string): string[] {
  const parsedUrl = new URL(url);
  return parsedUrl.searchParams.getAll('proxies');
}

export function flattenAccounts(accounts: Account[]): Account {
  if (accounts.length === 0) {
    console.error("Cannot flatten an empty array of accounts");
    return {} as Account
  }

  return {
    proxy: accounts[0].proxy,
    marketProfits: accounts.reduce((acc, account) => [...acc, ...account.marketProfits], [] as MarketProfit[])
  };
}

export default async function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      const proxies = getProxiesFromUrl(window.location.href);
      const fetchedAccounts = await getAccountsByProxy(proxies);
      setAccounts(fetchedAccounts);
    }

    fetchAccounts();
  }, []);

  const handleSubmit = (selectedCondition: Condition) => {
    // grab selectedCondition src url
    window.parent.postMessage({
      type: "createCast",
      data: {
        cast: {
          text: "",
          embeds: [`${DEPLOYMENT_URL}/api/generate?src=`]
        }
      }
    })
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
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
              // className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>
      <div>
        <ConditionSelectionForm account={flattenAccounts(accounts)} onSubmit={handleSubmit} />
      </div>

    </main>
  );
}
