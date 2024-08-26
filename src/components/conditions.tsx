import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Account, Condition, MarketProfit } from '@/lib/types';

interface ConditionSelectionFormProps {
  account: Account;
  onSubmit: (marketProfit: MarketProfit) => void;
}

export default function ConditionSelectionForm({ account, onSubmit }: ConditionSelectionFormProps) {
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConditionId) {
      const selectedMarketProfit = account.marketProfits.find(
        mp => mp.condition.id === selectedConditionId
      );
      if (selectedMarketProfit) {
        onSubmit(selectedMarketProfit);
      }
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Select a Position</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Positions</Label>
            <RadioGroup
              onValueChange={setSelectedConditionId}
              value={selectedConditionId || undefined}
            >
              {account.marketProfits.map((marketProfit) => (
                <div className="flex items-center space-x-3 space-y-0" key={marketProfit.condition.id}>
                  <RadioGroupItem value={marketProfit.condition.id} id={marketProfit.condition.id} />
                  <Label htmlFor={marketProfit.condition.id} className="font-normal">
                    {marketProfit.condition.title || 'Untitled Condition'}
                    <span className="block text-sm text-muted-foreground">
                      Profit: {marketProfit.scaledProfit}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <CardFooter className="px-0">
            <Button type="submit" className="w-full" disabled={!selectedConditionId}>
              Submit
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}