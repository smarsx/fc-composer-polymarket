import { GetServerSideProps } from 'next'
import { useState } from "react";
import { getPositionsByProxy } from "@/lib/sql";
import { DEPLOYMENT_URL } from "@/lib/constants";
import { Position } from '@/lib/position';
import { getProxiesFromUrl } from '@/lib/proxy';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

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

export default function Home({ positions: positionsIn }: Props) {
  const [positions] = useState<Position[]>(positionsIn);
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          uwu&nbsp;
          <code className="font-mono font-bold">@smarsx</code>
        </p>
      </div>
      <div>
        <Card className="w-[350px]">
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-3">
                <Label>Positions</Label>
                <RadioGroup
                  onValueChange={setSelectedConditionId}
                  value={selectedConditionId || undefined}
                >
                  {positions.map((position) => (
                    <div className="flex items-center space-x-3 space-y-0" key={position.conditionId}>
                      <RadioGroupItem value={position.conditionId} id={position.conditionId} />
                      <Label htmlFor={position.conditionId} className="font-normal">
                        {position.title || 'Untitled Condition'}
                        <span className="block text-sm text-muted-foreground">
                          {position.payouts[0] == '1' ? 'Yes' : 'No'}: {((position.profits / position.valueBought) * 100).toFixed(2) + "%"}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <CardFooter className="px-0">
                <Button className="w-full" disabled={!selectedConditionId} onClick={() => {
                  const pos = positions.find(
                    pos => pos.conditionId === selectedConditionId
                  );
                  if (pos) {
                    const outcome = pos.payouts[0] == '1' ? '1' : '0'
                    const pct = ((pos.profits / pos.valueBought) * 100).toFixed(2)
                    const genUrl = encodeURI(`${DEPLOYMENT_URL}/api/generate?src=${pos.src}&title=${pos.title}&pct=${pct}&outcome=${outcome}`);
                    window.parent.postMessage({
                      type: "createCast",
                      data: {
                        cast: {
                          text: "",
                          embeds: [genUrl]
                        }
                      }
                    }, "*");
                  }
                }}>
                  Submit
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
